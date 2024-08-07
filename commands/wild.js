const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, generateWildPokemon, updateUserData, getActivePokemon } = require('../utils/helpers.js');
const { v4: uuidv4 } = require('uuid');

const COOLDOWN_TIME = 10000; // 10 seconds in milliseconds

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wild')
        .setDescription('Encounter a wild Pokémon!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const userName = interaction.user.username || 'Trainer';

        try {
            console.log(`Wild command initiated by user ${userId}`);
            let userData = await getUserData(userId);
            if (!userData) {
                console.log(`User ${userId} needs to start their journey`);
                return interaction.reply('You need to start your journey first! Use the `/start` command.');
            }

            // Check cooldown
            const now = Date.now();
            if (userData.lastWildEncounter && now - userData.lastWildEncounter < COOLDOWN_TIME) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - userData.lastWildEncounter)) / 1000);
                return interaction.reply(`You need to wait ${remainingTime} more seconds before encountering another wild Pokémon!`);
            }

            const userLevel = Math.max(...userData.pokemon.map(p => p.level));
            const wildPokemon = generateWildPokemon(userLevel);
            const encounterId = uuidv4();

            console.log(`Generated wild Pokémon for user ${userId}: ${JSON.stringify(wildPokemon)}`);

            userData.currentWildPokemon = { ...wildPokemon, defeated: false, encounterId };
            userData.lastWildEncounter = now; // Update last encounter time
            await updateUserData(userId, userData);

            const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
            const encounterEmbed = createEncounterEmbed(wildPokemon, userName, avatarUrl);
            const actionRow = createActionRow();

            const response = await interaction.reply({embeds: [encounterEmbed], components: [actionRow], fetchReply: true });
            console.log(`Wild Pokémon encounter message sent for user ${userId}`);

            const collector = response.createMessageComponentCollector({ 
                filter: i => i.user.id === userId && i.customId === 'fight',
                time: 30000 // 30 seconds
            });

            collector.on('collect', async i => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "This isn't your encounter!", ephemeral: true });
                }

                if (i.customId === 'fight') {
                    await i.deferUpdate();
                    const fightCommand = require('./fight.js');
                    const fightResult = await fightCommand.execute(i, response, userData.currentWildPokemon.encounterId);
                    // After the fight, check for level up if the user won
                    if (fightResult && fightResult.userWon) {
                        await checkForLevelUp(userId, interaction);
                    }
                }
            });

            collector.on('end', async (collected, reason) => {
                console.log(`Collector ended for wild encounter. User: ${userId}, Reason: ${reason}, Interactions collected: ${collected.size}`);
                
                const disabledActionRow = actionRow.components.map(button => ButtonBuilder.from(button).setDisabled(true));
                await response.edit({ components: [new ActionRowBuilder().addComponents(disabledActionRow)] });
            });

        } catch (error) {
            console.error(`Error in wild command for user ${userId}: ${error.message}`);
            await interaction.reply('There was an error during the wild encounter. Please try again.');
        }
    },
};

function createEncounterEmbed(pokemon, userName, avatarUrl) {
    let imgUrl = 'https://play.pokemonshowdown.com/sprites/ani/';

    // Adjust imgUrl if the pokemon is shiny
    if (pokemon.isShiny) {
        imgUrl = 'https://play.pokemonshowdown.com/sprites/ani-shiny/';
    }

    const shinyEmoji = pokemon.isShiny ? '✨ ' : '';
    console.log(`Creating embed for ${pokemon.name}. Is shiny: ${pokemon.isShiny}`);
    return new EmbedBuilder()
        .setColor('#0c0c0c')
        .setAuthor({ 
            name: userName || 'Trainer',
            iconURL: avatarUrl
        })
        .setTitle(`A wild ${pokemon.name} ${shinyEmoji} appeared!`)
        .setDescription(`Level ${pokemon.level}${pokemon.isShiny ? ' (Shiny!)' : ''}`)
        .setImage(`${imgUrl}${pokemon.name.toLowerCase()}.gif`)
        .setFooter({ text: 'Click the Fight button to battle!' });
}

function createActionRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('fight')
                .setLabel('Fight')
                .setStyle(ButtonStyle.Primary)
        );
}

async function checkForLevelUp(userId, interaction) {
    try {
        const userData = await getUserData(userId);
        const activePokemon = await getActivePokemon(userData);

        if (!activePokemon) {
            console.log(`No active Pokémon found for user ${userId}`);
            return;
        }

        const chanceToLevelUp = Math.random();
        if (chanceToLevelUp < 0.1) { // 10% chance to level up, adjust as needed
            activePokemon.level += 1;
            await updateUserData(userId, userData);
            await interaction.followUp(`Congratulations! Your ${activePokemon.name} leveled up to level ${activePokemon.level}!`);
            console.log(`Pokémon ${activePokemon.name} leveled up to ${activePokemon.level} for user ${userId}`);
        }
    } catch (error) {
        console.error(`Error in checkForLevelUp for user ${userId}: ${error.message}`);
    }
}