const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getUserData, updateUserData, getActivePokemon, createBattleImage } = require('../utils/helpers.js');
const { createPokeBallButtons } = require('../utils/buttonUtils.js');
const catchModule = require('./catch.js');

module.exports = {
    async execute(interaction, originalMessage, encounterId) {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

        try {
            let replyFunction;
            if (originalMessage) {
                replyFunction = (options) => originalMessage.edit(options);
            } else {
                replyFunction = interaction.deferred || interaction.replied ?
                    (options) => interaction.editReply(options) :
                    (options) => interaction.reply(options);
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
                console.error(`Invalid wild Pokemon data for user: ${userId}`);
                return replyFunction({ content: "This wild Pokémon is no longer available. Try encountering a new one!", ephemeral: true });
            }

            const userPokemon = await getActivePokemon(userData);
            if (!userPokemon) {
                console.error(`Active Pokémon not found for user: ${userId}`);
                return replyFunction({ content: "Error: Active Pokémon not found. Please try again.", ephemeral: true });
            }

            const battleImage = await createBattleImage(userData, wildPokemon.name, wildPokemon.isShiny, wildPokemon.level);

            const expGained = Math.floor(wildPokemon.level * 10);
            const coinReward = Math.floor(wildPokemon.level * 5);

            userPokemon.exp += expGained;
            userData.money += coinReward;
            userData.currentWildPokemon.defeated = true;

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
                ${wildPokemon.isShiny ? '(It was a shiny Pokémon!)' : ''}`);

            if (battleImage) {
                resultEmbed.setImage('attachment://battle.png');
            }

            const pokeBallButtons = createPokeBallButtons(userData, encounterId);

            const replyOptions = {
                embeds: [resultEmbed],
                components: [pokeBallButtons],
                fetchReply: true
            };

            if (battleImage) {
                replyOptions.files = [new AttachmentBuilder(battleImage, { name: 'battle.png' })];
            }

            const fightReply = await replyFunction(replyOptions);

            await updateUserData(userId, userData);

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