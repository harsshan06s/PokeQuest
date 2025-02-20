const { EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, attemptCatch, updateCaughtPokemon } = require('../utils/helpers.js');

// Define item mappings
const ITEM_IDS = {
    1: "Pokeball",
    2: "Greatball",
    3: "Ultraball",
    4: "Masterball"
};

module.exports = {
    async handleCatchAttempt(interaction, fightMessage, encounterId) {
        try {
            const userId = interaction.user.id;
            const userName = interaction.user.username;
            const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
            let userData = await getUserData(userId);

            if (!userData || !userData.currentWildPokemon || userData.currentWildPokemon.encounterId !== encounterId) {
                return interaction.reply({ content: 'This Pokémon is no longer available to catch. Use /wild to encounter a new one.', ephemeral: true });
            }

            // Extract item ID from the custom ID and get item name
            const itemId = parseInt(interaction.customId.split('_')[1]);
            const itemName = ITEM_IDS[itemId];

            if (!itemName) {
                return interaction.reply({ content: 'Invalid item selected.', ephemeral: true });
            }

            // Check the item quantity based on item ID
            const itemCount = userData.items[itemId] || 0;

            if (itemCount <= 0) {
                return interaction.reply({ content: `You don't have any ${itemName}s!`, ephemeral: true });
            }

            // Decrease the item count after validation
            userData.items[itemId]--;

            const wildPokemon = userData.currentWildPokemon;
            const catchSuccess = attemptCatch(wildPokemon, itemName.toLowerCase());

            if (catchSuccess) {
                const normalizedName = wildPokemon.name.toLowerCase().replace(/\s+/g, '');
                if (!userData.caughtPokemon) userData.caughtPokemon = {};
                userData.caughtPokemon[normalizedName] = {
                    isShiny: wildPokemon.isShiny
                };

                // Update userData.pokemon with caught Pokémon details
                if (!userData.pokemon) userData.pokemon = [];
                userData.pokemon.push({
                    name: wildPokemon.name,
                    level: wildPokemon.level,
                    isShiny: wildPokemon.isShiny,
                    rarity: wildPokemon.rarity
                });

                delete userData.currentWildPokemon;
                await updateCaughtPokemon(userId, normalizedName, wildPokemon.isShiny);
            }

            // Update user data after the catch attempt
            await updateUserData(userId, userData);

            const shinyEmoji = wildPokemon.isShiny ? '✨ ' : '';
            const rarityEmoji = wildPokemon.rarity;

            let imgUrl = wildPokemon.isShiny 
                ? 'https://play.pokemonshowdown.com/sprites/ani-shiny/'
                : 'https://play.pokemonshowdown.com/sprites/ani/';

            const resultEmbed = new EmbedBuilder()
                .setColor(catchSuccess ? '#00FF00' : '#FF0000')
                .setAuthor({ 
                    name: userName || 'Trainer',
                    iconURL: avatarUrl
                })
                .setDescription(`You throw a ${itemName} to catch the Pokémon\n${catchSuccess
                    ? `You caught a ${wildPokemon.name} ${rarityEmoji}${shinyEmoji} (Lvl. ${wildPokemon.level})!`
                    : `Oh no! The wild ${shinyEmoji}${wildPokemon.name} ${rarityEmoji} broke free!${wildPokemon.isShiny ? ' (It was shiny!)' : ''}`}`)
                .setImage(`${imgUrl}${wildPokemon.name.toLowerCase()}.gif`);

            await interaction.reply({ embeds: [resultEmbed], components: [] });
            await fightMessage.edit({ components: [] }); // Remove all buttons after a catch attempt
        } catch (error) {
            console.error('Error in handleCatchAttempt:', error);
            await interaction.reply({ content: 'An error occurred while processing the catch. Please try again.', ephemeral: true });
        }
    }
};
