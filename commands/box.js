const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');
const fs = require('fs');
const path = require('path');
const POKEMON_TYPES = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pokemon_types.json'), 'utf8'));

const POKEMON_PER_PAGE = 10;

// Define lists of special Pokémon
const MYTHICAL_POKEMON = [
    "Victini", "Keldeo", "Meloetta", "Genesect", "Diancie", "Hoopa", "Volcanion", "Mew",
    "Celebi", "Jirachi", "Deoxys", "Manaphy", "Phione", "Darkrai", "Shaymin", "Arceus",
    "Marshadow", "Magearna", "Keldeo-Resolute", "Meloetta-Pirouette", "Genesect-Chill-Drive",
    "Genesect-Burn-Drive", "Genesect-Douse-Drive", "Genesect-Shock-Drive", "Mega-Diancie",
    "Hoopa-Unbound", "Shaymin-Sky", "Deoxys-Defense", "Deoxys-Attack", "Deoxys-Speed",
    "Magearna-Original", "Arceus-Bug", "Arceus-Dark", "Arceus-Dragon", "Arceus-Electric",
    "Arceus-Fighting", "Arceus-Fire", "Arceus-Flying", "Arceus-Ghost", "Arceus-Grass",
    "Arceus-Ground", "Arceus-Ice", "Arceus-Poison", "Arceus-Psychic", "Arceus-Rock",
    "Arceus-Steel", "Arceus-Water", "Arceus-Fairy"
];

const LEGENDARY_POKEMON = [
    "Articuno", "Zapdos", "Moltres", "Mewtwo", "Suicune", "Entei", "Raikou", "Ho-Oh", "Lugia",
    "Latias", "Latios", "Regirock", "Regice", "Registeel", "Groudon", "Kyogre", "Rayquaza",
    "Uxie", "Mesprit", "Azelf", "Heatran", "Regigigas", "Cresselia", "Dialga", "Palkia", "Giratina",
    "Tornadus", "Thundurus", "Landorus", "Cobalion", "Terrakion", "Virizion", "Reshiram", "Zekrom", "Kyurem",
    "Xerneas", "Yveltal", "Zygarde", "Tapu-Bulu", "Tapu-Koko", "Tapu-Lele", "Tapu-Fini",
    "Type:Null", "Silvally", "Cosmog", "Cosmoem", "Solgaleo", "Lunala", "Necrozma",
    "Zacian", "Zamazenta", "Regieleki", "Regidrago", "Kubfu", "Calyrex", "Urshifu", "Eternatus",
    "Mewtwo-MegaX", "Mewtwo-MegaY", "Articuno-Galar", "Moltres-Galar", "Zapdos-Galar",
    "Latios-Mega", "Latias-Mega", "Groudon-Primal", "Kyogre-Primal", "Rayquaza-Mega",
    "Dialga-Origin", "Palkia-Origin", "Giratina-Origin", "Tornadus-Therian", "Thundurus-Therian", "Landorus-Therian",
    "Kyurem-Black", "Kyurem-White", "Xerneas-Neutral", "Zygarde-10%", "Zygarde-Complete",
    "Necrozma-Ultra", "Necrozma-Dusk-Mane", "Necrozma-Dawn-Wings",
    "Zacian-Crowned", "Zamazenta-Crowned", "Calyrex-Shadow", "Calyrex-Ice",
    "Urshifu-Rapid-Strike",
    "Silvally-Fire", "Silvally-Water", "Silvally-Electric", "Silvally-Grass", "Silvally-Ice",
    "Silvally-Fighting", "Silvally-Poison", "Silvally-Ground", "Silvally-Flying", "Silvally-Psychic",
    "Silvally-Bug", "Silvally-Rock", "Silvally-Ghost", "Silvally-Dragon", "Silvally-Dark",
    "Silvally-Steel", "Silvally-Fairy"
];

const ULTRA_BEASTS = [
    "Nihilego", "Buzzwole", "Pheromosa", "Xurkitree", "Kartana", "Celesteela",
    "Guzzlord", "Blacephalon", "Stakataka", "Poipole", "Naganadel"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('box')
        .setDescription('View Pokémon collections')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Filter by Pokémon name')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter by Pokémon type')
                .setChoices(
                    ...(Object.keys(POKEMON_TYPES).length <= 25
                        ? Object.keys(POKEMON_TYPES).map(type => ({ name: type.charAt(0).toUpperCase() + type.slice(1), value: type }))
                        : [])
                )
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Filter by Pokémon level')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('mega')
                .setDescription('Filter for Mega Pokémon')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('shiny')
                .setDescription('Filter for Shiny Pokémon')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('special')
                .setDescription('Filter for Legendary, Mythical, or Ultra Beast Pokémon')
                .addChoices(
                    { name: 'Legendary', value: 'legendary' },
                    { name: 'Mythical', value: 'mythical' },
                    { name: 'Ultra Beast', value: 'ultrabeast' }
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Filter by Pokémon rarity')
                .addChoices(
                    { name: 'Normal', value: '<:n_:1259114941873520734>' },
                    { name: 'Uncommon', value: '<:U_:1259114756313452680>' },
                    { name: 'Rare', value: '<:r_:1259114608426487839>' },
                    { name: 'Super Rare', value: '<:SR:1259113778747015233>' },
                    { name: 'Ultra Rare', value: '<:UR:1259113669925539902>' },
                    { name: 'Legendary Rare', value: '<:LR:1259113497053233162>' }
                )
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose collection you want to view')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        const userName = targetUser.username;

        const nameFilter = interaction.options.getString('name');
        const typeFilter = interaction.options.getString('type');
        const levelFilter = interaction.options.getInteger('level');
        const megaFilter = interaction.options.getBoolean('mega');
        const shinyFilter = interaction.options.getBoolean('shiny');
        const specialFilter = interaction.options.getString('special');
        const rarityFilter = interaction.options.getString('rarity');

        const userData = await getUserData(userId);

        if (!userData || !Array.isArray(userData.pokemon) || userData.pokemon.length === 0) {
            return interaction.reply(`${userName} doesn't have any Pokémon yet!`);
        }

        let filteredPokemon = userData.pokemon.map((pokemon, index) => ({ ...pokemon, originalId: index + 1 })).filter(pokemon => {
            if (nameFilter && !pokemon.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
            if (typeFilter && !pokemon.types.some(type => type.toLowerCase() === typeFilter.toLowerCase())) return false;
            if (levelFilter !== null && pokemon.level !== levelFilter) return false;
            if (megaFilter !== null && pokemon.isMega !== megaFilter) return false;
            if (shinyFilter !== null && pokemon.isShiny !== shinyFilter) return false;
            if (specialFilter) {
                if (specialFilter === 'legendary' && !LEGENDARY_POKEMON.includes(pokemon.name)) return false;
                if (specialFilter === 'mythical' && !MYTHICAL_POKEMON.includes(pokemon.name)) return false;
                if (specialFilter === 'ultrabeast' && !ULTRA_BEASTS.includes(pokemon.name)) return false;
            }
            if (rarityFilter && pokemon.rarity !== rarityFilter) return false;
            return true;
        });

        function safeToLowerCase(input) {
            if (typeof input === 'string') {
                return input.toLowerCase();
            } else if (input && typeof input.toString === 'function') {
                return input.toString().toLowerCase();
            }
            return '';
        }

        const pages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
        let currentPage = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * POKEMON_PER_PAGE;
            const end = start + POKEMON_PER_PAGE;
            const pagePokemons = filteredPokemon.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${userName}'s Pokémon Collection`)
                .setDescription(`Showing ${filteredPokemon.length} of ${userData.pokemon.length} Pokémon`)
                .setFooter({ text: `Page ${page}/${pages}` });

            pagePokemons.forEach((pokemon) => {
                const boxId = pokemon.originalId;
                const pokemonName = pokemon.name || 'Unknown';
                const pokemonLevel = pokemon.level || 'N/A';
                const shinyEmoji = pokemon.isShiny ? '✨ ' : '';
                const megaEmoji = pokemon.isMega ? '🔷 ' : '';
                const rarity = pokemon.rarity || 'C';

                const types = POKEMON_TYPES[safeToLowerCase(pokemonName)] || pokemon.types || ['Unknown'];

                embed.addFields({
                    name: `ID: ${boxId} | ${rarity} ${megaEmoji}${pokemonName} ${shinyEmoji}`,
                    value: `Level ${pokemonLevel} | Type: ${types.join(', ')}`,
                    inline: false
                });
            });

            if (pagePokemons.length === 0) {
                embed.addFields({
                    name: 'No Pokémon',
                    value: 'No Pokémon match the current filters.',
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
};