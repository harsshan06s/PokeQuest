const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createOrUpdateUser, getUserData, getStarterPokemon } = require('../utils/helpers.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start your Pokémon journey!'),
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            const existingUser = await getUserData(userId);

            if (existingUser) {
                return interaction.reply({
                    content: "You've already started your Pokémon journey! If you want to restart, please contact an administrator.",
                    ephemeral: true
                });
            }

            const starterImagePath = path.join(__dirname, '..', 'utils', 'starter_image.png');
            const starterImage = new AttachmentBuilder(starterImagePath, { name: 'starter_image.png' });

            const showRegionSelection = () => {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Pokeventure')
                    .setDescription('Welcome to the beautiful world of Pokémon Lyntriz! Select the region where you want to start your journey:')
                    .setImage('attachment://starter_image.png');

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

                return { embeds: [embed], components: rows, files: [starterImage] };
            };

            const initialMessage = await interaction.reply(showRegionSelection());

            const filter = i => i.user.id === interaction.user.id;
            const collector = initialMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                try {
                    const selectedRegion = i.customId.split('_')[1];

                    if (!['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar'].includes(selectedRegion.toLowerCase())) {
                        await interaction.followUp({ content: 'Invalid region selected. Please try again.', ephemeral: true });
                        return;
                    }

                    let starterOptions;
                    try {
                        starterOptions = getStarterPokemon(selectedRegion.toLowerCase());
                        console.log('Starter options:', starterOptions);
                    } catch (error) {
                        console.error('Error in getStarterPokemon:', error.message);
                        await interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true });
                        return;
                    }

                    if (!starterOptions || starterOptions.length === 0) {
                        console.error('No starter options found for region:', selectedRegion);
                        await interaction.followUp({ content: 'An error occurred while fetching starter Pokémon. Please try again.', ephemeral: true });
                        return;
                    }

                    const showStarterSelection = () => {
                        const starterEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle(`${selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1)} Region`)
                            .setDescription('Choose your starter Pokémon:')
                            .setImage('attachment://starter_image.png');

                        const starterRow = new ActionRowBuilder();
                        starterOptions.forEach(starter => {
                            starterRow.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`starter_${starter.name.toLowerCase()}`)
                                    .setLabel(starter.name)
                                    .setStyle(ButtonStyle.Primary)
                            );
                        });

                        return { embeds: [starterEmbed], components: [starterRow], files: [starterImage] };
                    };

                    const starterMessage = await interaction.followUp(showStarterSelection());

                    const starterFilter = i2 => i2.user.id === interaction.user.id;
                    const starterCollector = starterMessage.createMessageComponentCollector({ filter: starterFilter, time: 30000 });

                    starterCollector.on('collect', async i2 => {
                        try {
                            const selectedStarterName = i2.customId.split('_')[1];
                            const selectedStarter = starterOptions.find(starter => starter.name.toLowerCase() === selectedStarterName);

                            console.log('Selected starter:', selectedStarterName);

                            if (!selectedStarter) {
                                console.error('Invalid starter selected:', selectedStarterName);
                                await interaction.followUp({ content: 'An error occurred while selecting your starter. Please try again.', ephemeral: true });
                                return;
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

                            await interaction.followUp({ embeds: [responseEmbed] });
                            starterCollector.stop();
                        } catch (error) {
                            console.error('Error in starter selection:', error);
                            await interaction.followUp({ content: `An error occurred: ${error.message}. Please try again.`, ephemeral: true });
                        }
                    });

                    starterCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'You did not select a starter Pokémon in time. Please try the command again.', ephemeral: true });
                        }
                    });

                    collector.stop();
                } catch (error) {
                    console.error('Error in region selection:', error);
                    await interaction.followUp({ content: `An error occurred: ${error.message}. Please try again.`, ephemeral: true });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({ content: 'You did not select a region in time. Please try the command again.', ephemeral: true });
                }
            });

        } catch (error) {
            console.error('Error in start command:', error);
            return interaction.reply({ content: `There was an error with your journey: ${error.message}. Please try again later.`, ephemeral: true });
        }
    },
};