const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');
const { createPokeBallButtons } = require('../utils/buttonUtils.js');
const catchModule = require('./catch.js');
const path = require('path');
const { createBattleImage } = require('../utils/helpers.js');

module.exports = {
    async execute(interaction, originalMessage, encounterId) {
        try {
            await originalMessage.edit({ components: [] });
        } catch (error) {
            console.error('Error removing fight button:', error);
        }
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
        console.log("Fight command executed for user:", userId);
    
        try {
            const userData = await getUserData(userId);
            console.log("User data retrieved:", JSON.stringify(userData, null, 2));
    
            if (!userData) {
                console.error("User data not found for user:", userId);
                return interaction.followUp("Error: User data not found. Please try starting your journey again.");
            }
    
            if (!userData.pokemon || userData.pokemon.length === 0) {
                console.error("User has no Pokémon:", userId);
                return interaction.followUp("Error: You don't have any Pokémon. Please start your journey again.");
            }
    
            if (typeof userData.selectedPokemon !== 'number' || userData.selectedPokemon < 0 || userData.selectedPokemon >= userData.pokemon.length) {
                console.error("Invalid selectedPokemon index:", userData.selectedPokemon);
                userData.selectedPokemon = 0; // Set to the first Pokémon as a fallback
                await updateUserData(userId, userData);
            }
    
            const wildPokemon = userData.currentWildPokemon;
            console.log("Wild Pokemon data:", JSON.stringify(wildPokemon, null, 2));
    
            if (!wildPokemon || wildPokemon.encounterId !== encounterId) {
                console.error("Invalid wild Pokemon data for user:", userId);
                return interaction.followUp("This wild Pokémon is no longer available. Try encountering a new one!");
            }
    
            const userPokemon = userData.activePokemon || userData.pokemon[userData.selectedPokemon];
            console.log("User Pokemon data:", JSON.stringify(userPokemon, null, 2));
    
            if (!userPokemon) {
                console.error("Selected Pokémon not found:", userData.selectedPokemon);
                return interaction.followUp("Error: Selected Pokémon not found. Please try again.");
            }
    
            const expGained = Math.floor(wildPokemon.level * 10);
            const coinReward = Math.floor(wildPokemon.level * 5);
            
    
            userPokemon.exp += expGained;
            userData.money += coinReward;
            userData.currentWildPokemon.defeated = true;
            await updateUserData(userId, userData);
    
            const battleImage = await createBattleImage(
                userData,
                wildPokemon.name,
                wildPokemon.isShiny,
                wildPokemon.level
            );
    
            const attachment = new AttachmentBuilder(battleImage, { name: 'battle.png' });
    
            const shinyEmoji = wildPokemon.isShiny ? '✨ ' : '';
    
            const resultEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setAuthor({ 
        name: username || 'Trainer',
        iconURL: avatarUrl
    })
    .setTitle('Battle Completed')
    .setDescription(`${userPokemon.name} defeated the wild ${shinyEmoji}${wildPokemon.name}!
    Gained ${expGained} EXP and ${coinReward} coins.
    ${wildPokemon.isShiny ? '(It was a shiny Pokémon!)' : ''}`)
    .setImage('attachment://battle.png');
    
            const pokeBallButtons = createPokeBallButtons(userData, encounterId);
    
            console.log('Sending fight reply...');
            const fightReply = await interaction.followUp({ 
                embeds: [resultEmbed], 
                components: [pokeBallButtons], 
                files: [attachment],
                fetchReply: true 
            });
            console.log('Fight reply sent successfully');
    
            // Set up collector for catch attempts
            const catchCollector = fightReply.createMessageComponentCollector({ time: 30000 });
    
            catchCollector.on('collect', async i => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "This isn't your catch attempt!", ephemeral: true });
                }
    
                await catchModule.handleCatchAttempt(i, fightReply, encounterId);
            });
    
            catchCollector.on('end', collected => {
                console.log(`Collector ended for fight command. User: ${userId}, Reason: ${collected.size === 0 ? 'time' : 'interaction'}, Interactions collected: ${collected.size}`);
                if (collected.size === 0) {
                    fightReply.edit({ components: [] }).catch(console.error);
                }
            });
    
        } catch (error) {
            console.error('Error in fight command:', error);
            await interaction.followUp({ content: 'There was an error processing the battle. Please try again.', ephemeral: true });
        }
    }
}