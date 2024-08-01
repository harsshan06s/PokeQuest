const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('manage')
    .setDescription('Manage Pokémon and resources for users')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create multiple Pokémon for a user')
        .addStringOption(option =>
          option.setName('pokemonnames')
            .setDescription('The names of the Pokémon to create (comma-separated)')
            .setRequired(true))
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to create the Pokémon for')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The level of the Pokémon')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100))
        .addStringOption(option =>
          option.setName('rarity')
            .setDescription('The rarity of the Pokémon')
            .setRequired(true)
            .addChoices(
              { name: 'Legendary Rare', value: '<:LR:1259113497053233162>' },
              { name: 'Uncommon', value: '<:n_:1259114941873520734>' },
              { name: 'Rare', value: '<:U_:1259114756313452680>' },
              { name: 'Epic', value: '<:r_:1259114608426487839>' },
              { name: 'Super Rare', value: '<:SR:1259113778747015233>' },
              { name: 'Ultra Rare', value: '<:UR:1259113669925539902>' }
            ))
        .addBooleanOption(option =>
          option.setName('shiny')
            .setDescription('Whether the Pokémon are shiny')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('give')
        .setDescription('Give coins to a user')
        .addUserOption(option =>
          option.setName('player')
            .setDescription('The user to give coins to')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('money')
            .setDescription('The amount of coins to give')
            .setRequired(true)
            .setMinValue(1)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need to be an administrator to use this command.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const pokemonNamesString = interaction.options.getString('pokemonnames');
      const pokemonNames = pokemonNamesString.split(',').map(name => name.trim());
      const targetUser = interaction.options.getUser('user');
      const level = interaction.options.getInteger('level');
      const rarity = interaction.options.getString('rarity');
      const isShiny = interaction.options.getBoolean('shiny');

      try {
        const userData = await getUserData(targetUser.id);
        
        if (!userData) {
          return interaction.reply({ content: 'User data not found.', ephemeral: true });
        }

        const createdPokemon = [];

        for (const pokemonName of pokemonNames) {
          const newPokemon = {
            name: pokemonName,
            level: level,
            rarity: rarity,
            isShiny: isShiny,
            moves: ['Tackle'], // You might want to add more default moves or make this dynamic
            exp: 0,
            catchRate: 100, // You might want to adjust this based on rarity
          };

          userData.pokemon.push(newPokemon);
          createdPokemon.push(pokemonName);
        }

        await updateUserData(targetUser.id, userData);

        const pokemonListString = createdPokemon.join(', ');
        await interaction.reply({ content: `Successfully created the following ${isShiny ? 'shiny ' : ''}Pokémon (Level ${level}, ${rarity}) for ${targetUser.username}: ${pokemonListString}.`, ephemeral: false });
      } catch (error) {
        console.error('Error in manage create command:', error);
        await interaction.reply({ content: 'An error occurred while creating the Pokémon.', ephemeral: true });
      }
    } else if (subcommand === 'give') {
      const targetUser = interaction.options.getUser('player');
      const amount = interaction.options.getInteger('money');

      try {
        const userData = await getUserData(targetUser.id);
        
        if (!userData) {
          return interaction.reply({ content: 'User data not found.', ephemeral: true });
        }

        // Add the coins to the user's balance
        userData.money = (userData.money || 0) + amount;

        await updateUserData(targetUser.id, userData);

        const formattedAmount = amount.toLocaleString();
        await interaction.reply({ content: `Successfully gave ${formattedAmount} coins to ${targetUser.username}.`, ephemeral: false });
      } catch (error) {
        console.error('Error in manage give command:', error);
        await interaction.reply({ content: 'An error occurred while giving coins.', ephemeral: true });
      }
    }
  },
};