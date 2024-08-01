const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserData, updateUserData } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setcustomrarity')
        .setDescription('Set custom rarity chance for a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to set custom rarity for')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('chance')
                .setDescription('The chance of getting a higher rarity (0-1)')
                .setRequired(true)),

    async execute(interaction) {
        // Check if the user has permission to use this command
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
    const chance = interaction.options.getNumber('chance');

    try {
        let userData = await getUserData(targetUser.id);
        if (!userData) {
            return interaction.reply({ content: 'User not found in the database.', ephemeral: true });
        }

        if (!userData.customChances) {
            userData.customChances = {};
        }
        userData.customChances.rarity = chance;

        await updateUserData(targetUser.id, userData);

        console.log(`Set custom rarity for user ${targetUser.id} to ${chance}`);

        return interaction.reply(`Custom rarity chance for ${targetUser.username} has been set to ${chance}.`);
    } catch (error) {
        console.error('Error setting custom rarity:', error);
        return interaction.reply({ content: 'An error occurred while setting the custom rarity.', ephemeral: true });
        }
    },
};