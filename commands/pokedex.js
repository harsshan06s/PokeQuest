const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');
const fs = require('fs');

// Load the Pokémon list from a JSON file
const pokemonList = JSON.parse(fs.readFileSync('pokemon.json', 'utf8'));

const POKEMON_PER_PAGE = 20;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokedex')
        .setDescription('Display the Pokédex'),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await getUserData(userId);
        if (!userData) {
            return interaction.reply('You need to start your journey first! Use the `/start` command.');
        }

        console.log(`Pokédex accessed by user ${userId}. Caught Pokémon:`, userData.caughtPokemon);

        const pokemons = pokemonList.pokemon.filter(p => p.id !== 0).sort((a, b) => a.id - b.id);

        const totalPages = Math.ceil(pokemons.length / POKEMON_PER_PAGE);

        let currentPage = 1;

        const normalizeName = (name) => name.toLowerCase().replace(/\s+/g, '');

        const generateEmbed = (page) => {
            const start = (page - 1) * POKEMON_PER_PAGE;
            const pagePokemons = pokemons.slice(start, start + POKEMON_PER_PAGE);

            const formatPokemon = (p, index) => {
                const normalizedName = normalizeName(p.name);
                const isCaught = userData.caughtPokemon && userData.caughtPokemon[normalizedName];
                const isShiny = isCaught && userData.caughtPokemon[normalizedName].isShiny;
                const pokeballIcon = isCaught ? '<:Pokeball:1259115461770084457>' : '<:PokeballUndexed:1259419454249635850>';
                const shinyIcon = isShiny ? '<:ShinyDexed:1259419941187354678>' : '<:ShinyUndexed:1259418975394205736>';
                return `${start + index + 1}. ${pokeballIcon}${shinyIcon} ${p.name}`;
            };

            const leftColumn = pagePokemons.slice(0, 10).map((p, index) => formatPokemon(p, index)).join('\n');
            const rightColumn = pagePokemons.slice(10, 20).map((p, index) => formatPokemon(p, index + 10)).join('\n');

            const caughtCount = Object.keys(userData.caughtPokemon || {}).length;
            const shinyCaughtCount = Object.values(userData.caughtPokemon || {}).filter(p => p.isShiny).length;

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Pokédex')
                .setDescription(`<:Pokeball:1259115461770084457>Pokémons caught: ${caughtCount}\n<:ShinyDexed:1259419941187354678> Shiny caught: ${shinyCaughtCount}`)
                .addFields(
                    { name: '\u200B', value: leftColumn, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '\u200B', value: rightColumn, inline: true }
                )
                .setFooter({ text: `Page ${page}/${totalPages}` });

            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
            );

        const response = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: [row],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "You can't use these buttons.", ephemeral: true });
            }

            if (i.customId === 'previous') {
                if (currentPage > 1) {
                    currentPage--;
                } else {
                    currentPage = totalPages; // Go to the last page if currently on the first page
                }
            } else if (i.customId === 'next') {
                if (currentPage < totalPages) {
                    currentPage++;
                } else {
                    currentPage = 1; // Go to the first page if currently on the last page
                }
            }

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [row]
            });
        });

        collector.on('end', () => {
            row.components.forEach(button => button.setDisabled(true));
            interaction.editReply({ components: [row] });
        });
    },
};
