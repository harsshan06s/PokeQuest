const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');

const POKEMON_PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('box')
        .setDescription('View your Pokémon collection'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = await getUserData(userId);

        if (!userData || !Array.isArray(userData.pokemon) || userData.pokemon.length === 0) {
            return interaction.reply('You don\'t have any Pokémon yet! Use /start to begin your journey.');
        }

        const pages = Math.ceil(userData.pokemon.length / POKEMON_PER_PAGE);
        let currentPage = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * POKEMON_PER_PAGE;
            const end = start + POKEMON_PER_PAGE;
            const pagePokemons = userData.pokemon.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Your Pokémon Collection')
                .setDescription(`You have ${userData.pokemon.length} Pokémon`)
                .setFooter({ text: `Page ${page}/${pages}` });

            pagePokemons.forEach((pokemon) => {
                const randomId = Math.floor(Math.random() * 10000) + 1;
                const pokemonName = pokemon.name || 'Unknown';
                const pokemonLevel = pokemon.level || 'N/A';
                
                embed.addFields({
                    name: `${randomId}. ${pokemon.shiny ? '⭐ ' : ''}${pokemonName}`,
                    value: `Level ${pokemonLevel}`,
                    inline: false
                });
            });

            if (pagePokemons.length === 0) {
                embed.addFields({
                    name: 'No Pokémon',
                    value: 'This page is empty.',
                    inline: false
                });
            }

            return embed;
        };

        const generateRow = (currentPage, pages) => {
            const row = new ActionRowBuilder();
            
            if (pages > 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages)
                );
            }
            
            return row;
        };

        const initialMessage = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: pages > 1 ? [generateRow(currentPage, pages)] : [],
            fetchReply: true
        });

        if (pages > 1) {
            const collector = initialMessage.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId === 'previous' && currentPage > 1) {
                        currentPage--;
                    } else if (i.customId === 'next' && currentPage < pages) {
                        currentPage++;
                    }

                    await i.update({
                        embeds: [generateEmbed(currentPage)],
                        components: [generateRow(currentPage, pages)]
                    });
                } else {
                    await i.reply({ content: 'These buttons aren\'t for you!', ephemeral: true });
                }
            });

            collector.on('end', () => {
                initialMessage.edit({ components: [] }).catch(console.error);
            });
        }
    },
};