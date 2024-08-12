const { EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, attemptCatch, updateCaughtPokemon} = require('../utils/helpers.js');

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
    
            const ballType = interaction.customId.split('_')[1];
            const wildPokemon = userData.currentWildPokemon;
    
            if (!userData.items[ballType] || userData.items[ballType] <= 0) {
                return interaction.reply({ content: `You don't have any ${ballType}s!`, ephemeral: true });
            }
    
            // Decrease the ball count immediately after checking if the user has any
            userData.items[ballType]--;
            
            const catchSuccess = attemptCatch(wildPokemon, ballType);
    
            if (catchSuccess) {
                const normalizedName = wildPokemon.name.toLowerCase().replace(/\s+/g, '');
                if (!userData.caughtPokemon) userData.caughtPokemon = {};
                userData.caughtPokemon[normalizedName] = {
                    isShiny: wildPokemon.isShiny
                };
                
                // Add this block to update userData.pokemon
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
            // Update user data after the catch attempt, regardless of the outcome
            await updateUserData(userId, userData);
            const shinyEmoji = wildPokemon.isShiny ? '✨ ' : '';
            const rarityEmoji = wildPokemon.rarity;

            let imgUrl = wildPokemon.isShiny 
            ? 'https://play.pokemonshowdown.com/sprites/ani-shiny/'
            : 'https://play.pokemonshowdown.com/sprites/ani/';

            const ballTypeCapitalized = ballType.charAt(0).toUpperCase() + ballType.slice(1);

            const resultEmbed = new EmbedBuilder()
                .setColor(catchSuccess ? '#00FF00' : '#FF0000')
                .setAuthor({ 
                    name: userName || 'Trainer',
                    iconURL: avatarUrl
                })
                .setDescription(`You throw a ${ballTypeCapitalized} to catch the Pokémon\n${catchSuccess
                    ? `You caught a ${wildPokemon.name} ${rarityEmoji}${shinyEmoji} (Lvl. ${wildPokemon.level})!`
                    : `Oh no! The wild ${shinyEmoji}${wildPokemon.name} ${rarityEmoji} broke free!${wildPokemon.isShiny ? ' (It was shiny!)' : ''}`}`)
                .setImage(`${imgUrl}${wildPokemon.name.toLowerCase()}.gif`)
                

            await interaction.reply({ embeds: [resultEmbed], components: [] });
            await fightMessage.edit({ components: [] }); // Remove all buttons after a catch attempt
        } catch (error) {
            console.error('Error in handleCatchAttempt:', error);
            await interaction.reply({ content: 'An error occurred while processing the catch. Please try again.', ephemeral: true });
        }
    }
};