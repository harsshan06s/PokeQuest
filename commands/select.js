const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('select')
        .setDescription('Select a Pokémon from your box as your active Pokémon')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The ID of the Pokémon you want to select')
                .setRequired(true)),

                async execute(interaction) {
                    const userId = interaction.user.id;
                    const selectedId = interaction.options.getInteger('id');
            
                    try {
                        const userData = await getUserData(userId);
            
                        if (!userData || !Array.isArray(userData.pokemon) || userData.pokemon.length === 0) {
                            return interaction.reply('You don\'t have any Pokémon in your box!');
                        }
            
                        const selectedPokemon = userData.pokemon.find((pokemon, index) => index + 1 === selectedId);
            
                        if (!selectedPokemon) {
                            const validIds = userData.pokemon.map((_, index) => index + 1).join(', ');
                            return interaction.reply(`No Pokémon found with ID ${selectedId} in your box. Valid IDs are: ${validIds}`);
                        }
            
                        // Update the user's active Pokémon
                        userData.activePokemon = selectedPokemon;
                        userData.selectedPokemon = userData.pokemon.indexOf(selectedPokemon);
                        await updateUserData(userId, userData);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Pokémon Selected!')
                .setDescription(`You've selected ${selectedPokemon.name} as your active Pokémon.`)
                .addFields(
                    { name: 'Name', value: selectedPokemon.name, inline: true },
                    { name: 'Level', value: selectedPokemon.level.toString(), inline: true },
                    { name: 'Rarity', value: selectedPokemon.rarity || 'N/A', inline: true },
                    { name: 'Shiny', value: selectedPokemon.isShiny ? 'Yes' : 'No', inline: true }
                );

            if (selectedPokemon.isShiny) {
                embed.setImage(`https://play.pokemonshowdown.com/sprites/ani-shiny/${selectedPokemon.name.toLowerCase()}.gif`);
            } else {
                embed.setImage(`https://play.pokemonshowdown.com/sprites/ani/${selectedPokemon.name.toLowerCase()}.gif`);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in select command:', error);
            await interaction.reply('An error occurred while selecting the Pokémon. Please try again.');
        }
    },
};