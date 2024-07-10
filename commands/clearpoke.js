const { SlashCommandBuilder } = require('discord.js');
const { clearUserBoxPokemonData } = require('../utils/helpers.js'); // Make sure this import is correct
const REQUIRED_ROLE_ID = '1243875628667899965';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-box-pokemon')
        .setDescription('Clear box Pokémon data for a specific user (Admin only)')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user whose box Pokémon data to clear')
                .setRequired(true)),

    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUserId = interaction.options.getString('userid');

        // Ask for confirmation
        await interaction.reply({ content: `Are you sure you want to clear box Pokémon data for user ${targetUserId}? This will remove all Pokémon except the starter and preserve Pokédex data. This action cannot be undone. Reply with "confirm" to proceed.`, ephemeral: true });

        const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === 'confirm';
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async () => {
            const result = await clearUserBoxPokemonData(targetUserId); // This line was changed
            if (result.success) {
                await interaction.followUp({ content: result.message, ephemeral: true });
            } else {
                await interaction.followUp({ content: `Error: ${result.message}`, ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Command cancelled: no confirmation received.', ephemeral: true });
            }
        });
    },
};