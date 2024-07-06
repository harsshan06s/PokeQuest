const { EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, attemptCatch } = require('../utils/helpers.js');

module.exports = {
    async handleCatchAttempt(interaction, fightMessage, encounterId) {
        try {
            const userId = interaction.user.id;
            let userData = await getUserData(userId);
            
            if (!userData || !userData.currentWildPokemon || userData.currentWildPokemon.encounterId !== encounterId) {
                return interaction.reply({ content: 'This Pokémon is no longer available to catch. Use /wild to encounter a new one.', ephemeral: true });
            }

            const ballType = interaction.customId.split('_')[1];
            const wildPokemon = userData.currentWildPokemon;

            if (!userData.items[ballType] || userData.items[ballType] <= 0) {
                return interaction.reply({ content: `You don't have any ${ballType}s!`, ephemeral: true });
            }

            const catchSuccess = attemptCatch(wildPokemon, ballType);

            userData.items[ballType]--;
            if (catchSuccess) {
                userData.pokemon.push(wildPokemon);
            }
            delete userData.currentWildPokemon;
            await updateUserData(userId, userData);

            const resultEmbed = new EmbedBuilder()
                .setColor(catchSuccess ? '#00FF00' : '#FF0000')
                .setTitle(catchSuccess ? 'Catch Successful!' : 'Catch Failed')
                .setDescription(catchSuccess
                    ? `You caught the wild ${wildPokemon.name} (Lvl. ${wildPokemon.level})!`
                    : `Oh no! The wild ${wildPokemon.name} broke free!`)
                .setFooter({ text: 'Use /wild to encounter another Pokémon!' });

            await interaction.reply({ embeds: [resultEmbed], components: [] });
            await fightMessage.edit({ components: [] }); // Remove all buttons after a catch attempt
        } catch (error) {
            console.error('Error in handleCatchAttempt:', error);
            await interaction.reply({ content: 'An error occurred while processing the catch. Please try again.', ephemeral: true });
        }
    }
};