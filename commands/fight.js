const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, updateUserData, attemptCatch } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fight')
        .setDescription('Fight the wild Pokémon you encountered!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            // Get the most up-to-date user data
            let userData = await getUserData(userId);
            if (!userData || !userData.currentWildPokemon) {
                return interaction.reply('There is no wild Pokémon to fight! Use /wild to encounter one first.');
            }

            const wildPokemon = userData.currentWildPokemon;
            const userPokemon = userData.pokemon[0]; // Assuming the first Pokémon fights

            // Simulate battle (you can expand this with more complex battle mechanics)
            const expGained = Math.floor(wildPokemon.level * 10);
            const coinReward = Math.floor(wildPokemon.level * 5);

            // Update user data
            userPokemon.exp += expGained;
            userData.money += coinReward;

            // Save the updated user data
            userData = await updateUserData(userId, userData);

            // Create result embed
            const resultEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`The wild ${wildPokemon.name} fainted!`)
                .setDescription(`${userPokemon.name} gained ${expGained} Exp. points.\nYou earned ${coinReward} coins.`)
                .setFooter({ text: 'Choose a Poké Ball to catch it!' });

            // Create Poké Ball buttons
            const pokeBallButtons = createPokeBallButtons(userData);

            // Check if it's a button interaction or a slash command
            if (interaction.isButton()) {
                await interaction.update({ embeds: [resultEmbed], components: [pokeBallButtons] });
            } else {
                await interaction.reply({ embeds: [resultEmbed], components: [pokeBallButtons] });
            }

            // Set up a new collector for the catch buttons
            const filter = i => i.user.id === userId && i.customId.startsWith('catch_');
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                const ballType = i.customId.split('_')[1];
                const catchResult = await handleCatch(userData, wildPokemon, ballType);
                await i.update(catchResult);
                collector.stop();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    if (interaction.isButton()) {
                        interaction.editReply({ content: 'Catch attempt timed out.', components: [] });
                    } else {
                        interaction.followUp({ content: 'Catch attempt timed out.', components: [] });
                    }
                }
            });

        } catch (error) {
            console.error(error);
            if (interaction.isButton()) {
                await interaction.update({ content: 'There was an error processing the battle. Please try again.', components: [] });
            } else {
                await interaction.reply({ content: 'There was an error processing the battle. Please try again.', components: [] });
            }
        }
    },
};

function createPokeBallButtons(userData) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('catch_pokeball')
                .setLabel(`Pokeball (${userData.items.pokeball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(userData.items.pokeball <= 0),
            new ButtonBuilder()
                .setCustomId('catch_greatball')
                .setLabel(`Greatball (${userData.items.greatball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(userData.items.greatball <= 0),
            new ButtonBuilder()
                .setCustomId('catch_ultraball')
                .setLabel(`Ultraball (${userData.items.ultraball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(userData.items.ultraball <= 0),
            new ButtonBuilder()
                .setCustomId('catch_masterball')
                .setLabel(`Masterball (${userData.items.masterball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(userData.items.masterball <= 0)
        );
}

async function handleCatch(userData, wildPokemon, ballType) {
    const catchSuccess = attemptCatch(wildPokemon, ballType);

    // Update user data
    userData.items[ballType]--;
    if (catchSuccess) {
        userData.pokemon.push(wildPokemon);
    }
    delete userData.currentWildPokemon;
    await updateUserData(userData.id, userData);

    // Create result embed
    const resultEmbed = new EmbedBuilder()
        .setColor(catchSuccess ? '#00FF00' : '#FF0000')
        .setTitle(catchSuccess ? 'Catch Successful!' : 'Catch Failed')
        .setDescription(catchSuccess 
            ? `You caught the wild ${wildPokemon.name} (Lvl. ${wildPokemon.level})!`
            : `Oh no! The wild ${wildPokemon.name} broke free!`)
        .setFooter({ text: `${ballType} used: ${userData.items[ballType]} remaining` });

    return { embeds: [resultEmbed], components: [] };
}