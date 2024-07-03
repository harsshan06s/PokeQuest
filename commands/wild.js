const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, generateWildPokemon, updateUserData } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wild')
        .setDescription('Encounter a wild Pokémon!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            const userData = await getUserData(userId);
            if (!userData) {
                return interaction.reply('You need to start your journey first! Use the `/start` command.');
            }

            const userLevel = Math.max(...userData.pokemon.map(p => p.level));
            const wildPokemon = generateWildPokemon(userLevel);

            // Create and send the initial encounter embed
            const encounterEmbed = createEncounterEmbed(wildPokemon);
            const actionRow = createActionRow();

            const response = await interaction.reply({ embeds: [encounterEmbed], components: [actionRow], fetchReply: true });

            // Set up a collector for button interactions
            const collector = response.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "This isn't your encounter!", ephemeral: true });
                }
            
                if (i.customId === 'fight') {
                    // Store the wild Pokémon in user data
                    userData.currentWildPokemon = wildPokemon;
                    await updateUserData(userId, userData);
            
                    // Execute the fight command
                    const fightCommand = interaction.client.commands.get('fight');
                    if (fightCommand) {
                        await fightCommand.execute(i);
                    }
                    
                    // Stop the collector after fight
                    collector.stop();
                }
            });

            collector.on('end', () => {
                // Do not remove components here
            });

        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error during the wild encounter. Please try again.');
        }
    },
};

function createEncounterEmbed(pokemon) {
    return new EmbedBuilder()
        .setColor('#FF5733')
        .setTitle(`A wild ${pokemon.name} appeared!`)
        .setDescription(`Level ${pokemon.level}`)
        .setImage(`https://example.com/pokemon/${pokemon.name.toLowerCase()}.png`)
        .setFooter({ text: 'What will you do?' });
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