const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserData, updateUserData,getcustomrarity } = require('../utils/helpers');

const baseRarities = [
  { emoji: '<:n_:1259114941873520734>', chance: 700/1851 },
  { emoji: '<:U_:1259114756313452680>', chance: 500/1851 },
  { emoji: '<:r_:1259114608426487839>', chance: 300/1851},
  { emoji: '<:SR:1259113778747015233>', chance: 250/1851},
  { emoji: '<:UR:1259113669925539902>', chance: 200/1851 },
  { emoji: '<:LR:1259113497053233162>', chance: 100/1851 }
];



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

        if (chance < 0 || chance > 1) {
            return interaction.reply({ content: 'The chance must be between 0 and 1.', ephemeral: true });
        }

        try {
            let userData = await getUserData(targetUser.id);
            if (!userData) {
                return interaction.reply({ content: 'User not found in the database.', ephemeral: true });
            }

            if (!userData.customChances) {
                userData.customChances = {};
            }
            userData.customChances.rarity = chance;

            // Calculate and store the custom rarities
            const customRarities = getcustomrarity(baseRarities, chance);
            userData.customRarities = customRarities;

            await updateUserData(targetUser.id, userData);

            console.log(`Set custom rarity for user ${targetUser.id} to ${chance}`);

            // Create a string to display the new rarity chances
            const rarityDisplay = customRarities.map(rarity => 
                `${rarity.emoji}: ${(rarity.chance * 100).toFixed(2)}%`
            ).join('\n');

            return interaction.reply(`Custom rarity chance for ${targetUser.username} has been set to ${chance}.\nNew rarity chances:\n${rarityDisplay}`);
        } catch (error) {
            console.error('Error setting custom rarity:', error);
            return interaction.reply({ content: 'An error occurred while setting the custom rarity.', ephemeral: true });
        }
    },
};