const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getUserData, updateUserData, getActivePokemon, createBattleImage, calculateExperience, experienceToNextLevel } = require('../utils/helpers.js');
const { createPokeBallButtons } = require('../utils/buttonUtils.js');
const catchModule = require('./catch.js');

module.exports = {
    async execute(interaction, originalMessage, encounterId,client) {
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

            // Assign a growth type if it's not set
            if (!userPokemon.growthType) {
                const growthTypes = ['Erratic', 'Fast', 'MediumFast', 'MediumSlow', 'Slow', 'Fluctuating'];
                userPokemon.growthType = growthTypes[Math.floor(Math.random() * growthTypes.length)];
                await updateUserData(userId, userData);  // Update after assigning growth type
            }

            const battleImage = await createBattleImage(userData, wildPokemon.name, wildPokemon.isShiny, wildPokemon.level);

            // Calculate experience gained from battle
            // Calculate the next level's experience requirement
            const expGained = calculateExperience(userPokemon.growthType, wildPokemon.level);
        console.log(`EXP gained: ${expGained}`);

        // Add the experience points to the userPokemon's exp
        userPokemon.exp += expGained;
        console.log(`Total EXP after gain: ${userPokemon.exp}`);

        // Leveling up logic with maximum level check and improved logging
        let levelsGained = 0;
        while (userPokemon.exp >= experienceToNextLevel(userPokemon.level, userPokemon.growthType) && userPokemon.level < 100) {
            const currentLevelExp = experienceToNextLevel(userPokemon.level, userPokemon.growthType);
            console.log(`Level ${userPokemon.level} requires ${currentLevelExp} EXP`);
            
            userPokemon.level += 1;
            userPokemon.exp -= currentLevelExp;
            levelsGained++;
            
            console.log(`Leveled up to ${userPokemon.level}, remaining EXP: ${userPokemon.exp}`);
        }

        console.log(`Total levels gained: ${levelsGained}`);

        // Update the userData object with the new level and exp of the active Pokémon
        const userPokemonIndex = userData.pokemon.findIndex(p => p.id === userPokemon.id);
        userData.pokemon[userPokemonIndex].level = userPokemon.level;
        userData.pokemon[userPokemonIndex].exp = userPokemon.exp;

        // Update the userData in the database
        await updateUserData(userId, userData);

        const coinReward = Math.floor(wildPokemon.level * 5);
        userData.money += coinReward;


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