const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
                .setImage('https://example.com/starters_image.png');

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('kanto')
                        .setLabel('Kanto')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('johto')
                        .setLabel('Johto')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('hoenn')
                        .setLabel('Hoenn')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('sinnoh')
                        .setLabel('Sinnoh')
                        .setStyle(ButtonStyle.Primary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('unova')
                        .setLabel('Unova')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('kalos')
                        .setLabel('Kalos')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('alola')
                        .setLabel('Alola')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('galar')
                        .setLabel('Galar')
                        .setStyle(ButtonStyle.Primary)
                );

            const message = await interaction.reply({ embeds: [embed], components: [row1, row2], fetchReply: true });

            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                const selectedRegion = i.customId.charAt(0).toUpperCase() + i.customId.slice(1);
                const existingUser = await getUserData(userId);
                const userData = await createOrUpdateUser(userId, i.customId);

                let responseMessage;
                if (existingUser) {
                    responseMessage = `Welcome back! You've restarted your Pokémon journey in the ${selectedRegion} region! Your new starter Pokémon is ${userData.pokemon[0].name}!`;
                } else {
                    responseMessage = `Welcome to your new Pokémon journey in the ${selectedRegion} region! Your starter Pokémon is ${userData.pokemon[0].name}!`;
                }

                await i.update({ content: responseMessage, embeds: [], components: [] });
                collector.stop();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'You did not select a region in time. Please try the command again.', embeds: [], components: [] });
                }
            });

        } catch (error) {
            console.error(error);
            return interaction.followUp('There was an error with your journey. Please try again later.');
        }
    },
};