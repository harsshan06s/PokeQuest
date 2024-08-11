const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createOrUpdateUser, getUserData } = require('../utils/helpers.js');
const { getStarterPokemon } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start your Pokémon journey!'),
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            await interaction.deferReply();

            const existingUser = await getUserData(userId);

            if (existingUser) {
                return interaction.editReply({
                    content: "You've already started your Pokémon journey! If you want to restart, please contact an administrator.",
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Pokeventure')
                .setDescription('Welcome to the beautiful world of Pokémon Lyntriz! Select the region where you want to start your journey:')
                .setImage('https://example.com/starters_image.png');

            const rows = [];
            const regionsPerRow = 4;
            const regions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar'];
            for (let i = 0; i < regions.length; i += regionsPerRow) {
                const row = new ActionRowBuilder();
                regions.slice(i, i + regionsPerRow).forEach(region => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`region_${region}`)
                            .setLabel(region.charAt(0).toUpperCase() + region.slice(1))
                            .setStyle(ButtonStyle.Primary)
                    );
                });
                rows.push(row);
            }

            const message = await interaction.editReply({ embeds: [embed], components: rows, fetchReply: true });

            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                await i.deferUpdate();
                const selectedRegion = i.customId.split('_')[1];

                const starterOptions = getStarterPokemon(selectedRegion.toLowerCase());

                const starterEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1)} Region`)
                    .setDescription('Choose your starter Pokémon:');

                const starterRow = new ActionRowBuilder();
                starterOptions.forEach(starter => {
                    starterRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`starter_${starter.name.toLowerCase()}`)
                            .setLabel(starter.name)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                await i.editReply({ embeds: [starterEmbed], components: [starterRow] });

                const starterFilter = i2 => i2.user.id === interaction.user.id;
                const starterCollector = message.createMessageComponentCollector({ filter: starterFilter, time: 30000 });

                starterCollector.on('collect', async i2 => {
                    await i2.deferUpdate();
                    const selectedStarterName = i2.customId.split('_')[1];
                    const selectedStarter = starterOptions.find(starter => starter.name.toLowerCase() === selectedStarterName);

                    if (!selectedStarter) {
                        return i2.editReply({ content: 'An error occurred while selecting your starter. Please try again.', components: [] });
                    }

                    const userData = await createOrUpdateUser(userId, selectedRegion, selectedStarter);

                    const responseEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`${selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1)} Region`)
                        .setDescription(`Welcome to your new Pokémon journey in the ${selectedRegion} region! Your starter Pokémon is ${selectedStarter.name}.`)
                        .addFields(
                            { name: 'Type', value: selectedStarter.type, inline: true },
                            { name: 'Level', value: selectedStarter.level.toString(), inline: true },
                            { name: 'Moves', value: selectedStarter.moves.join(', '), inline: true },
                            { name: 'Rarity', value: selectedStarter.rarity, inline: true }
                        );

                    await i2.editReply({ embeds: [responseEmbed], components: [] });
                    starterCollector.stop();
                });

                starterCollector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.followUp({ content: 'You did not select a starter Pokémon in time. Please try the command again.', ephemeral: true });
                    }
                });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'You did not select a region in time. Please try the command again.', components: [] });
                }
            });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'There was an error with your journey. Please try again later.', ephemeral: true });
        }
    },
};