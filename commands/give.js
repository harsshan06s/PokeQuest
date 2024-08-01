const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give coins to another user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to give coins to')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('The amount of coins to give')
        .setRequired(true)
        .setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const giver = interaction.user;
    const receiver = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('quantity');

    if (giver.id === receiver.id) {
      return interaction.reply({ content: 'You cannot give coins to yourself.', ephemeral: true });
    }

    try {
      const giverData = await getUserData(giver.id);
      const receiverData = await getUserData(receiver.id);

      if (!giverData || !receiverData) {
        return interaction.reply({ content: 'User data not found.', ephemeral: true });
      }

      if (giverData.money < amount) {
        return interaction.reply({ content: 'You do not have enough coins.', ephemeral: true });
      }

      // Update balances
      giverData.money -= amount;
      receiverData.money += amount;

      // Save updated user data
      await updateUserData(giver.id, giverData);
      await updateUserData(receiver.id, receiverData);

      await interaction.reply({ content: `Successfully gave ${amount} coins to ${receiver.username}.`, ephemeral: false });
    } catch (error) {
      console.error('Error in give command:', error);
      await interaction.reply({ content: 'An error occurred while processing the transaction.', ephemeral: true });
    }
  },
};