const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, updateUserData, deleteUserData, writeUserData } = require('../utils/helpers.js');  // Updated to include deleteUserData

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
        .addSubcommand(subcommand =>
            subcommand
                .setName('restart')
                .setDescription('Restart a user\'s journey')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to restart')
                        .setRequired(true)
                ))
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
                        moves: ['Tackle'],
                        exp: 0,
                        catchRate: 100,
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

                userData.money = (userData.money || 0) + amount;

                await updateUserData(targetUser.id, userData);

                const formattedAmount = amount.toLocaleString();
                await interaction.reply({ content: `Successfully gave ${formattedAmount} coins to ${targetUser.username}.`, ephemeral: false });
            } catch (error) {
                console.error('Error in manage give command:', error);
                await interaction.reply({ content: 'An error occurred while giving coins.', ephemeral: true });
            }
        } else if (subcommand === 'restart') {
            const targetUser = interaction.options.getUser('user');

            if (!targetUser) {
                return interaction.reply({ content: 'Please specify a valid user.', ephemeral: true });
            }

            try {
                // Delete all of the user's data using deleteUserData
                await deleteUserData(targetUser.id);

                await interaction.reply({ content: `${targetUser.username}'s journey has been completely restarted. They can now use the /start command again to choose a new starter Pokémon and region.`, ephemeral: true });

                try {
                    await targetUser.send('Your Pokémon journey has been completely restarted by an administrator. You can now use the /start command to begin your new adventure, choose a new starter Pokémon, and select a region!');
                } catch (error) {
                    console.error('Failed to send DM to user:', error);
                    await interaction.followUp({ content: 'The user was restarted, but I couldn\'t send them a DM about it.', ephemeral: true });
                }
            } catch (error) {
                console.error('Error in /manage restart command:', error);
                await interaction.reply({ content: 'An error occurred while trying to restart the user\'s journey.', ephemeral: true });
            }
        }
    }
};
