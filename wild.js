const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, generateWildPokemon, updateUserData } = require('../utils/helpers.js');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wild')
        .setDescription('Encounter a wild Pokémon!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            console.log(`Wild command initiated by user ${userId}`);
            let userData = await getUserData(userId);
            if (!userData) {
                console.log(`User ${userId} needs to start their journey`);
                return interaction.reply('You need to start your journey first! Use the `/start` command.');
            }

            const userLevel = Math.max(...userData.pokemon.map(p => p.level));
            const wildPokemon = generateWildPokemon(userLevel);
            const encounterId = uuidv4();

            console.log(`Generated wild Pokémon for user ${userId}:`, JSON.stringify(wildPokemon, null, 2));

            userData.currentWildPokemon = { ...wildPokemon, defeated: false, encounterId };
            await updateUserData(userId, userData);

            const encounterEmbed = createEncounterEmbed(wildPokemon);
            const actionRow = createActionRow();

            const response = await interaction.reply({ embeds: [encounterEmbed], components: [actionRow], fetchReply: true });
            console.log(`Wild Pokémon encounter message sent for user ${userId}`);

            const collector = response.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "This isn't your encounter!", ephemeral: true });
                }

                if (i.customId === 'fight') {
                    await i.deferUpdate();
                    const fightCommand = require('./fight.js');
                    await fightCommand.execute(i, response, encounterId);
                }
            });

            collector.on('end', async (collected, reason) => {
                console.log(`Collector ended for wild encounter. User: ${userId}, Reason: ${reason}, Interactions collected: ${collected.size}`);
                
                const disabledActionRow = actionRow.components.map(button => ButtonBuilder.from(button).setDisabled(true));
                await response.edit({ components: [new ActionRowBuilder().addComponents(disabledActionRow)] });
            });

        } catch (error) {
            console.error(`Error in wild command for user ${userId}:`, error);
            await interaction.reply('There was an error during the wild encounter. Please try again.');
        }
    },
};

function createEncounterEmbed(pokemon) {
    const imgUrl = 'https://img.pokemondb.net/sprites/x-y/normal/';
    return new EmbedBuilder()
        .setColor('#0c0c0c')
        .setTitle(`A wild ${pokemon.name} appeared!`)
        .setDescription(`Level ${pokemon.level}`)
        .setImage(`${imgUrl}${pokemon.name.toLowerCase()}.png`)
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