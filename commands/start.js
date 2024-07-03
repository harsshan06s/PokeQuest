const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createOrUpdateUser, getUserData } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start or restart your Pokémon journey!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Pokeventure')
                .setDescription('Welcome to the beautiful world of Pokémon Lyntriz! Select the region where you want your starter from:')
                .addFields(
                    { name: '#1', value: 'Kanto', inline: true },
                    { name: '#2', value: 'Johto', inline: true },
                    { name: '#3', value: 'Hoenn', inline: true },
                    { name: '#4', value: 'Sinnoh', inline: true },
                    { name: '#5', value: 'Unova', inline: true },
                    { name: '#6', value: 'Kalos', inline: true },
                    { name: '#7', value: 'Alola', inline: true },
                    { name: '#8', value: 'Galar', inline: true }
                )
                .setImage('https://example.com/starters_image.png');

            await interaction.reply({ embeds: [embed] });

            const filter = m => m.author.id === interaction.user.id && !isNaN(m.content) && m.content >= 1 && m.content <= 8;
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });

            if (collected.size > 0) {
                const regionNumber = parseInt(collected.first().content);
                const regions = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar'];
                const selectedRegion = regions[regionNumber - 1];

                const existingUser = await getUserData(userId);
                const userData = await createOrUpdateUser(userId, selectedRegion.toLowerCase());
                
                if (existingUser) {
                    await interaction.followUp(`Welcome back! You've restarted your Pokémon journey in the ${selectedRegion} region! Your new starter Pokémon is ${userData.starterPokemon.name}!`);
                } else {
                    await interaction.followUp(`Welcome to your new Pokémon journey in the ${selectedRegion} region! Your starter Pokémon is ${userData.starterPokemon.name}!`);
                }
            } else {
                await interaction.followUp('You did not select a region in time. Please try the command again.');
            }
        } catch (error) {
            console.error(error);
            return interaction.followUp('There was an error with your journey. Please try again later.');
        }
    },
};