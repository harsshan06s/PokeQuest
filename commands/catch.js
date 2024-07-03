const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, attemptCatch } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('catch')
        .setDescription('Attempt to catch the wild Pokémon')
        .addStringOption(option =>
            option.setName('ball')
                .setDescription('The type of Poké Ball to use')
                .setRequired(true)
                .addChoices(
                    { name: 'Pokeball', value: 'pokeball' },
                    { name: 'Greatball', value: 'greatball' },
                    { name: 'Ultraball', value: 'ultraball' },
                    { name: 'Masterball', value: 'masterball' }
                )),
    async execute(interaction) {
        const userId = interaction.user.id;
        const ballType = interaction.options.getString('ball');

        try {
            const userData = await getUserData(userId);
            if (!userData || !userData.currentWildPokemon) {
                return interaction.reply('There is no wild Pokémon to catch! Use /wild to encounter one first.');
            }

            const wildPokemon = userData.currentWildPokemon;

            // Check if the user has the selected ball
            if (!userData.items[ballType] || userData.items[ballType] <= 0) {
                return interaction.reply(`You don't have any ${ballType}s!`);
            }

            // Attempt to catch the Pokémon
            const catchSuccess = attemptCatch(wildPokemon, ballType);

            // Update user data
            userData.items[ballType]--;
            if (catchSuccess) {
                userData.pokemon.push(wildPokemon);
            }
            delete userData.currentWildPokemon;
            await updateUserData(userId, userData);

            // Create result embed
            const resultEmbed = new EmbedBuilder()
                .setColor(catchSuccess ? '#00FF00' : '#FF0000')
                .setTitle(catchSuccess ? 'Catch Successful!' : 'Catch Failed')
                .setDescription(catchSuccess 
                    ? `You caught the wild ${wildPokemon.name} (Lvl. ${wildPokemon.level})!`
                    : `Oh no! The wild ${wildPokemon.name} broke free!`)
                .setFooter({ text: `${ballType} used: ${userData.items[ballType]} remaining` });

            await interaction.reply({ embeds: [resultEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error processing the catch. Please try again.');
        }
    },
};