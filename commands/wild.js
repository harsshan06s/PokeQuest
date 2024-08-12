const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, generateWildPokemon, updateUserData, getActivePokemon, saveEssentialUserData } = require('../utils/helpers.js');
const { v4: uuidv4 } = require('uuid');

const COOLDOWN_TIME = 10000; // 10 seconds in milliseconds

const baseRarities = [
  { emoji: '<:n_:1259114941873520734>', chance: 700/1851 },
  { emoji: '<:U_:1259114756313452680>', chance: 500/1851 },
  { emoji: '<:r_:1259114608426487839>', chance: 300/1851},
  { emoji: '<:SR:1259113778747015233>', chance: 250/1851},
  { emoji: '<:UR:1259113669925539902>', chance: 200/1851 },
  { emoji: '<:LR:1259113497053233162>', chance: 100/1851 }
];

function getcustomrarity(baseRarities, customChance) {
  let customRarities = JSON.parse(JSON.stringify(baseRarities));
  let highRarityChance = customRarities.slice(3).reduce((sum, rarity) => sum + rarity.chance, 0);
  let boostFactor = 1 + (customChance * 0.5);
  
  for (let i = 3; i < customRarities.length; i++) {
    customRarities[i].chance *= boostFactor;
  }
  
  let newTotalChance = customRarities.reduce((sum, rarity) => sum + rarity.chance, 0);
  
  customRarities.forEach(rarity => {
    rarity.chance /= newTotalChance;
  });
  
  return customRarities;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wild')
        .setDescription('Encounter a wild Pokémon!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const userName = interaction.user.username || 'Trainer';

        try {
            let userData = await getUserData(userId);
            if (!userData) {
                return interaction.reply('You need to start your journey first! Use the `/start` command.');
            }

            // Check cooldown
            const now = Date.now();
            if (userData.lastWildEncounter && now - userData.lastWildEncounter < COOLDOWN_TIME) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - userData.lastWildEncounter)) / 1000);
                return interaction.reply(`You need to wait ${remainingTime} more seconds before encountering another wild Pokémon!`);
            }

            // Apply custom rarity if set
            let rarities = baseRarities;
            if (userData.customChances && userData.customChances.rarity) {
                rarities = getcustomrarity(baseRarities, userData.customChances.rarity);
            }

            const userLevel = Math.max(...userData.pokemon.map(p => p.level));
            const wildPokemon = generateWildPokemon(userLevel, rarities);
            const encounterId = uuidv4();

            console.log(`User ${userName} encountered a wild ${wildPokemon.name} (Level ${wildPokemon.level})`);

            userData.currentWildPokemon = { ...wildPokemon, defeated: false, encounterId };
            userData.lastWildEncounter = now; // Update last encounter time
            await updateUserData(userId, userData);
            await saveEssentialUserData(userId, userData);

            const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
            const encounterEmbed = createEncounterEmbed(wildPokemon, userName, avatarUrl);
            const actionRow = createActionRow();

            const response = await interaction.reply({embeds: [encounterEmbed], components: [actionRow], fetchReply: true });

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
    if (pokemon.isShiny) {
        imgUrl = 'https://play.pokemonshowdown.com/sprites/ani-shiny/';
    }

    const shinyEmoji = pokemon.isShiny ? '✨ ' : '';
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
            return;
        }

        const chanceToLevelUp = Math.random();
        if (chanceToLevelUp < 0.1) { // 10% chance to level up, adjust as needed
            activePokemon.level += 1;
            await updateUserData(userId, userData);
            await interaction.followUp(`Congratulations! Your ${activePokemon.name} leveled up to level ${activePokemon.level}!`);
            console.log(`${interaction.user.username}'s ${activePokemon.name} leveled up to ${activePokemon.level}`);
        }
    } catch (error) {
        console.error(`Error in checkForLevelUp for user ${userId}: ${error.message}`);
    }
}