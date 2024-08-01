// ../commands/setuserperk.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { adminSetUserPerk } = require('../utils/perk.js');  // Make sure the path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuserperk')
        .setDescription('Admin command to set a user\'s perk')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to set the perk for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('perktype')
                .setDescription('The type of perk to set')
                .setRequired(true)
                .addChoices(
                    { name: 'Shiny Boost', value: 'shinyBoost' },
                    { name: 'Rarity Boost', value: 'rarityBoost' }
                ))
        .addNumberOption(option =>
            option.setName('value')
                .setDescription('The value to set for the perk')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Check if the user has Administrator permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const perkType = interaction.options.getString('perktype');
        const value = interaction.options.getNumber('value');

        try {
            await adminSetUserPerk(interaction.user.id, targetUser.id, perkType, value);
            await interaction.reply(`Successfully set ${perkType} to ${value} for user ${targetUser.tag}`);
        } catch (error) {
            await interaction.reply({ content: `Error setting perk: ${error.message}`, ephemeral: true });
        }
    },
};