// fight.js

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getUserData, updateUserData, getActivePokemon, createBattleImage, calculateExperience, experienceToNextLevel, gainExperience, evolveSelectedPokemonIfEligible } = require('../utils/helpers.js');
const { createPokeBallButtons } = require('../utils/buttonUtils.js');
const catchModule = require('./catch.js');

module.exports = {
    async execute(interaction, originalMessage, encounterId, client) {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

        try {
            let replyFunction;
            if (originalMessage) {
                replyFunction = (options) => originalMessage.edit(options);
            } else {
                replyFunction = interaction.deferred || interaction.replied
                    ? (options) => interaction.editReply(options)
                    : (options) => interaction.reply(options);
            }

            const userData = await getUserData(userId);
            if (!userData) {
                console.error(`User data not found for user: ${userId}`);
                return replyFunction({ content: "Error: User data not found. Please try starting your journey again.", ephemeral: true });
            }

            if (!userData.pokemon || userData.pokemon.length === 0) {
                console.error(`User has no Pokémon: ${userId}`);
                return replyFunction({ content: "Error: You don't have any Pokémon. Please start your journey again.", ephemeral: true });
            }

            const wildPokemon = userData.currentWildPokemon;
            if (!wildPokemon || wildPokemon.encounterId !== encounterId) {
                console.error(`Invalid wild Pokémon data for user: ${userId}`);
                return replyFunction({ content: "This wild Pokémon is no longer available. Try encountering a new one!", ephemeral: true });
            }

            let userPokemon = await getActivePokemon(userData); // Fetch the selected Pokémon
            if (!userPokemon) {
                console.error(`Active Pokémon not found for user: ${userId}`);
                return replyFunction({ content: "Error: Active Pokémon not found. Please try again.", ephemeral: true });
            }

            // Assign a growth type if it's not set
            if (!userPokemon.growthType) {
                const growthTypes = ['Erratic', 'Fast', 'MediumFast', 'MediumSlow', 'Slow', 'Fluctuating'];
                userPokemon.growthType = growthTypes[Math.floor(Math.random() * growthTypes.length)];
                await updateUserData(userId, userData);  // Update after assigning growth type
            }

            // Calculate experience gained from battle
            const expGained = calculateExperience(userPokemon.growthType, wildPokemon.level);
            console.log(`EXP gained: ${expGained}`);

            // Gain experience and handle leveling up and evolution
            const userPokemonIndex = userData.selectedPokemon; // Ensure we get the index of the selected Pokémon
            await gainExperience(userId, userPokemonIndex, expGained, wildPokemon.level);

            // Reload the updated user data and Pokémon data to ensure live updates
            const updatedUserData = await getUserData(userId);
            userPokemon = updatedUserData.pokemon[userPokemonIndex]; // Reload the evolved/leveled Pokémon

            // Create the battle image for the evolved/leveled Pokémon
            const battleImage = await createBattleImage(updatedUserData, wildPokemon.name, wildPokemon.isShiny, wildPokemon.level);

            // Prepare result embed with updated Pokémon data
            const resultEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({
                    name: username || 'Trainer',
                    iconURL: avatarUrl
                })
                .setTitle('Battle Completed')
                .setDescription(`${userPokemon.name} defeated the wild ${wildPokemon.isShiny ? '✨ ' : ''}${wildPokemon.name}!
                Gained ${expGained} EXP and ${Math.floor(wildPokemon.level * 5)} coins.
                ${userPokemon.name} is now at level ${userPokemon.level}.`);

            if (battleImage) {
                resultEmbed.setImage('attachment://battle.png');
            }

            const replyOptions = {
                embeds: [resultEmbed],
                components: [createPokeBallButtons(userData, encounterId)],
                fetchReply: true
            };

            if (battleImage) {
                replyOptions.files = [new AttachmentBuilder(battleImage, { name: 'battle.png' })];
            }

            // Check for evolution message and update embed if Pokémon evolved
            const evolutionResult = await evolveSelectedPokemonIfEligible(userId);

if (evolutionResult && typeof evolutionResult === 'string') {
    // Successful evolution
    const evolutionEmbed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle("Your Pokémon has evolved!")
        .setDescription(evolutionResult); // Add the success message
    replyOptions.embeds.push(evolutionEmbed);
} else if (evolutionResult && typeof evolutionResult === 'object' && evolutionResult.message) {
    // Evolution failed, log the message (optional)
    console.log(`Evolution not possible: ${evolutionResult.message}`);
}

            // Update the user data in the database
            await updateUserData(userId, updatedUserData);

            const fightReply = await replyFunction(replyOptions);

            // Set up catch collector
            const catchCollector = fightReply.createMessageComponentCollector({ time: 30000 });
            catchCollector.on('collect', async i => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "This isn't your catch attempt!", ephemeral: true });
                }
                await catchModule.handleCatchAttempt(i, fightReply, encounterId);
            });
            catchCollector.on('end', collected => {
                if (collected.size === 0) {
                    fightReply.edit({ components: [] }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error in fight command:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error processing the battle. Please try again.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error processing the battle. Please try again.', ephemeral: true });
            }
        }
    }
};
