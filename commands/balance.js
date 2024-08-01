const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('money')
    .setDescription('Check your coin balance or another user\'s balance')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check (Admin only)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    let targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Check if the command user is an admin when checking another user's balance
    if (targetUser.id !== interaction.user.id && 
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need to be an administrator to check other users\' balance.', ephemeral: true });
    }

    try {
      const userData = await getUserData(targetUser.id);
      
      if (!userData) {
        return interaction.reply({ content: 'User data not found.', ephemeral: true });
      }
      const formattedMoney = userData.money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const embed = new EmbedBuilder()
        .setColor('#FFD700') // Gold color
        .setTitle(`${targetUser.username}'s Balance`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields({ name: 'Coins', value: formattedMoney, inline: true })
        .setFooter({ text: 'Poké Testers' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching user data:', error);
      await interaction.reply({ content: 'An error occurred while fetching the balance.', ephemeral: true });
    }
  },
};