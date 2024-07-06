const { EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');
const { createPokeBallButtons } = require('../utils/buttonUtils.js');
const catchModule = require('./catch.js');

module.exports = {
    async execute(interaction, originalMessage, encounterId) {
        try {
            const userId = interaction.user.id;
            console.log(`Executing fight command for user ${userId}`);

            let userData = await getUserData(userId);
            
            if (!userData.currentWildPokemon || userData.currentWildPokemon.defeated || userData.currentWildPokemon.encounterId !== encounterId) {
                return interaction.followUp({ content: 'There is no valid wild Pokémon to fight! Use /wild to encounter one first.', ephemeral: true });
            }

            const wildPokemon = userData.currentWildPokemon;
            const userPokemon = userData.pokemon[0]; // Assuming the first Pokémon is used for battle

            const expGained = Math.floor(wildPokemon.level * 10);
            const coinReward = Math.floor(wildPokemon.level * 5);

            userPokemon.exp += expGained;
            userData.money += coinReward;
            userData.currentWildPokemon.defeated = true;
            await updateUserData(userId, userData);

            const resultEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Battle Completed')
                .setDescription(`${userPokemon.name} defeated the wild ${wildPokemon.name}!
                Gained ${expGained} EXP and ${coinReward} coins.`)
                .setImage('https://play.pokemonshowdown.com/sprites/gen6bgs/bg-city.jpg')

            const pokeBallButtons = createPokeBallButtons(userData, encounterId);

            const fightReply = await interaction.followUp({ embeds: [resultEmbed], components: [pokeBallButtons], fetchReply: true });
            
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
};