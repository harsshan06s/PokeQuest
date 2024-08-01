const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');

const POKEMON_PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('box')
        .setDescription('View Pokémon collections')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a user\'s Pokémon collection')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user whose collection you want to view')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('my')
                .setDescription('View your own Pokémon collection')),

                async execute(interaction) {
                    const subcommand = interaction.options.getSubcommand();
                    let userId;
                    let userName;
                
                    if (subcommand === 'view') {
                        const targetUser = interaction.options.getUser('user');
                        userId = targetUser ? targetUser.id : interaction.user.id;
                        userName = targetUser ? targetUser.username : interaction.user.username;
                    } else {
                        userId = interaction.user.id;
                        userName = interaction.user.username;
                    }
                
                    const userData = await getUserData(userId);
                
                    if (!userData || !Array.isArray(userData.pokemon) || userData.pokemon.length === 0) {
                        return interaction.reply(`${userName} doesn't have any Pokémon yet!`);
                    }
                
                    const pages = Math.ceil(userData.pokemon.length / POKEMON_PER_PAGE);
                    let currentPage = 1;
                
                    const generateEmbed = (page) => {
                        const start = (page - 1) * POKEMON_PER_PAGE;
                        const end = start + POKEMON_PER_PAGE;
                        const pagePokemons = userData.pokemon.slice(start, end);
                
                        const embed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle(`${userName}'s Pokémon Collection`)
                            .setDescription(`${userName} has ${userData.pokemon.length} Pokémon`)
                            .setFooter({ text: `Page ${page}/${pages}` });
                
                        pagePokemons.forEach((pokemon, index) => {
                            const boxId = start + index + 1;
                            const pokemonName = pokemon.name || 'Unknown';
                            const pokemonLevel = pokemon.level || 'N/A';
                            const shinyEmoji = pokemon.isShiny ? '✨ ' : '';
                            const rarityEmoji = pokemon.rarity || '';
                            
                            embed.addFields({
                                name: `ID: ${boxId} | ${rarityEmoji} ${pokemonName} ${shinyEmoji}`,
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
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('Next')
                                    .setStyle(ButtonStyle.Primary)
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
                        const collector = initialMessage.createMessageComponentCollector({ time: 100000 });
                
                        collector.on('collect', async i => {
                            if (i.user.id === interaction.user.id) {
                                if (i.customId === 'previous') {
                                    currentPage = currentPage > 1 ? currentPage - 1 : pages;
                                } else if (i.customId === 'next') {
                                    currentPage = currentPage < pages ? currentPage + 1 : 1;
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
                }
            }