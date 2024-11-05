const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');
const axios = require('axios');

// Type effectiveness data
const typeEffectiveness = {
    normal: { weaknesses: ['fighting'], immunities: ['ghost'] },
    fire: { weaknesses: ['water', 'ground', 'rock'], resistances: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'] },
    water: { weaknesses: ['electric', 'grass'], resistances: ['fire', 'water', 'ice', 'steel'] },
    electric: { weaknesses: ['ground'], resistances: ['electric', 'flying', 'steel'] },
    grass: { weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug'], resistances: ['water', 'electric', 'grass', 'ground'] },
    ice: { weaknesses: ['fire', 'fighting', 'rock', 'steel'], resistances: ['ice'] },
    fighting: { weaknesses: ['flying', 'psychic', 'fairy'], resistances: ['bug', 'rock', 'dark'] },
    poison: { weaknesses: ['ground', 'psychic'], resistances: ['grass', 'fighting', 'poison', 'bug', 'fairy'] },
    ground: { weaknesses: ['water', 'grass', 'ice'], immunities: ['electric'], resistances: ['poison', 'rock'] },
    flying: { weaknesses: ['electric', 'ice', 'rock'], immunities: ['ground'], resistances: ['grass', 'fighting', 'bug'] },
    psychic: { weaknesses: ['bug', 'ghost', 'dark'], resistances: ['fighting', 'psychic'] },
    bug: { weaknesses: ['fire', 'flying', 'rock'], resistances: ['grass', 'fighting', 'ground'] },
    rock: { weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'], resistances: ['normal', 'fire', 'poison', 'flying'] },
    ghost: { weaknesses: ['ghost', 'dark'], immunities: ['normal', 'fighting'], resistances: ['poison', 'bug'] },
    dragon: { weaknesses: ['ice', 'dragon', 'fairy'], resistances: ['fire', 'water', 'electric', 'grass'] },
    dark: { weaknesses: ['fighting', 'bug', 'fairy'], immunities: ['psychic'], resistances: ['ghost', 'dark'] },
    steel: { weaknesses: ['fire', 'fighting', 'ground'], immunities: ['poison'], resistances: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'] },
    fairy: { weaknesses: ['poison', 'steel'], immunities: ['dragon'], resistances: ['fighting', 'bug', 'dark'] }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokemon')
        .setDescription('Get detailed information about a specific Pokémon')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the Pokémon')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const pokemonName = interaction.options.getString('name').toLowerCase();
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
            const speciesResponse = await axios.get(response.data.species.url);
            const pokemon = response.data;
            
            // Fetch all relevant data
            const [evolutionData, varietiesData, formsData] = await Promise.all([
                fetchEvolutionData(speciesResponse.data.evolution_chain.url),
                fetchVarieties(speciesResponse.data.varieties),
                Promise.all(pokemon.forms.map(form => axios.get(form.url).then(res => res.data)))
            ]);

            // Create enhanced embeds
            const pages = [
                {
                    embed: createMainEmbed(pokemon, speciesResponse.data),
                    name: '📝 Overview'
                },
                {
                    embed: createStatsEmbed(pokemon),
                    name: '📊 Stats & Types'
                }
            ];

            const formsEmbed = createFormsEmbed(varietiesData, formsData);
            if (formsEmbed) pages.push({ embed: formsEmbed, name: '🔄 Forms' });

            const evolutionEmbed = createEvolutionEmbed(evolutionData);
            if (evolutionEmbed) pages.push({ embed: evolutionEmbed, name: '⚡ Evolution' });

            // Create enhanced navigation
            const row = createNavigationButtons(pages);

            const replyMessage = await interaction.editReply({
                embeds: [pages[0].embed],
                components: pages.length > 1 ? [row] : []
            });
            
            if (pages.length > 1) {
                const collector = replyMessage.createMessageComponentCollector({ time: 120000 });
                let currentPage = 0;
            
                collector.on('collect', async i => {
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: "❌ Only the command user can navigate through pages!", ephemeral: true });
                    }
            
                    if (i.customId === 'previous') {
                        currentPage = currentPage > 0 ? currentPage - 1 : pages.length - 1;
                    } else if (i.customId === 'next') {
                        currentPage = currentPage < pages.length - 1 ? currentPage + 1 : 0;
                    }
            
                    await i.update({
                        embeds: [pages[currentPage].embed],
                        components: [createNavigationButtons(pages, currentPage)]
                    });
                });
            
                collector.on('end', () => {
                    const disabledRow = createNavigationButtons(pages, currentPage, true);
                    interaction.editReply({ components: [disabledRow] });
                });
            }

        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Pokemon Not Found')
                .setDescription('Sorry, I couldn\'t find that Pokémon. Please check the spelling and try again.')
                .setFooter({ text: 'Tip: Try using the English name of the Pokémon' });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

function createMainEmbed(pokemon, speciesData) {
    const types = pokemon.types.map(type => {
        const typeEmojis = {
            normal: '⚪', fire: '🔥', water: '💧', electric: '⚡',
            grass: '🌿', ice: '❄️', fighting: '👊', poison: '☠️',
            ground: '🌍', flying: '🦅', psychic: '🔮', bug: '🐛',
            rock: '🪨', ghost: '👻', dragon: '🐲', dark: '🌑',
            steel: '⚔️', fairy: '🧚'
        };
        return `${typeEmojis[type.type.name] || ''} ${type.type.name.toUpperCase()}`;
    }).join(' | ');

    const embed = new EmbedBuilder()
        .setTitle(`✨ #${pokemon.id} ${pokemon.name.toUpperCase()} ✨`)
        .setDescription(`*${speciesData.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No description available.'}*`)
        .setThumbnail(pokemon.sprites.other['official-artwork'].front_default)
        .setColor(getTypeColor(pokemon.types[0].type.name))
        .addFields(
            { name: '📋 Types', value: types, inline: true },
            { name: '📏 Height', value: `${pokemon.height / 10}m`, inline: true },
            { name: '⚖️ Weight', value: `${pokemon.weight / 10}kg`, inline: true },
            { name: '💫 Abilities', value: pokemon.abilities.map(ability => 
                `${ability.is_hidden ? '🔮' : '⭐'} ${capitalizeFirst(ability.ability.name)}`
            ).join('\n') }
        );

    if (speciesData.has_gender_differences) {
        embed.addFields({ name: '⚥ Gender Differences', value: '✅ This Pokémon has visual differences between genders' });
    }

    return embed;
}

function createStatsEmbed(pokemon) {
    const statEmojis = {
      'hp': '❤️',
      'attack': '⚔️',
      'defense': '🛡️',
      'special-attack': '🔮',
      'special-defense': '🔰',
      'speed': '⚡'
    };
  
    const starEmojis = {
      start_filled: '<:_:1303052054201368626>',
      mid_filled: '<:_:1303049675338940522>',
      end_filled: '<:_:1303050592637419520>',
      start_empty: '<:_:1303052741408591872>',
      mid_empty: '<:_:1303022776524865576>',
      end_empty: '<:_:1303048400391897098>'
    };
  
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${pokemon.name.toUpperCase()} - Base Stats`)
      .setColor(getTypeColor(pokemon.types[0].type.name))
      .setThumbnail(pokemon.sprites.front_default);
  
    // Generate stats display
    const statsDisplay = pokemon.stats.map(stat => {
      const maxBars = 12;
      const filledBars = Math.round((stat.base_stat / 255) * maxBars);
      const emptyBars = maxBars - filledBars;
  
      let barDisplay = '';
  
      // Add filled bars
      if (filledBars > 0) {
        barDisplay += starEmojis.start_filled;
        for (let i = 1; i < filledBars; i++) {
          barDisplay += starEmojis.mid_filled;
        }
      }
  
      // Add empty bars immediately after filled bars
      if (emptyBars > 0) {
        // If there were no filled bars, start with start_empty
        if (filledBars === 0) {
          barDisplay += starEmojis.start_empty;
          for (let i = 1; i < emptyBars; i++) {
            barDisplay += starEmojis.mid_empty;
          }
          barDisplay += starEmojis.end_empty;
        } else {
          // If there were filled bars, continue with mid_empty
          for (let i = 0; i < emptyBars - 1; i++) {
            barDisplay += starEmojis.mid_empty;
          }
          barDisplay += starEmojis.end_empty;
        }
      } else if (stat.base_stat === 255) {
        // Only use end_filled for maximum stats
        barDisplay += starEmojis.end_filled;
      } else {
        // Use mid_filled for the last filled bar if not maximum
        barDisplay += starEmojis.mid_filled;
      }
  
      return `${statEmojis[stat.stat.name]} **${capitalizeFirst(stat.stat.name)}** (${stat.base_stat})\n${barDisplay}`;
    }).join('\n\n');
  
    // Calculate type effectiveness
    const { weaknesses, resistances, immunities } = calculateTypeEffectiveness(pokemon.types);
  
    // Build description combining stats and type effectiveness
    let description = `${statsDisplay}\n\n`;
  
    if (weaknesses.size > 0) {
      description += `**⚠️ Weaknesses**\n${Array.from(weaknesses)
        .map(type => `${getTypeEmoji(type)} ${type.toUpperCase()}`)
        .join(', ')}\n\n`;
    }
  
    if (resistances.size > 0) {
      description += `**🛡️ Resistances**\n${Array.from(resistances)
        .map(type => `${getTypeEmoji(type)} ${type.toUpperCase()}`)
        .join(', ')}\n\n`;
    }
  
    if (immunities.size > 0) {
      description += `**✨ Immunities**\n${Array.from(immunities)
        .map(type => `${getTypeEmoji(type)} ${type.toUpperCase()}`)
        .join(', ')}`;
    }
  
    embed.setDescription(description);
  
    return embed;
  }
  

function createFormsEmbed(varieties, forms) {
    if (varieties.length <= 1 && forms.length <= 1) return null;

    const embed = new EmbedBuilder()
        .setTitle(`🔄 ${capitalizeFirst(forms[0].name)} - Alternative Forms`)
        .setColor(getTypeColor(forms[0].types[0].type.name));

    if (forms.length > 1) {
        embed.addFields({
            name: '📋 Regular Forms',
            value: forms.map(form => `• ${capitalizeFirst(form.name)}`).join('\n')
        });
    }

    const megaEvolutions = varieties.filter(v => v.pokemon.name.includes('mega'));
    const otherVarieties = varieties.filter(v => !v.pokemon.name.includes('mega') && v.pokemon.name !== forms[0].name);

    if (megaEvolutions.length > 0) {
        embed.addFields({
            name: '⚡ Mega Evolutions',
            value: megaEvolutions.map(v => `• ${capitalizeFirst(v.pokemon.name)}`).join('\n')
        });
    }

    if (otherVarieties.length > 0) {
        embed.addFields({
            name: '✨ Other Forms',
            value: otherVarieties.map(v => `• ${capitalizeFirst(v.pokemon.name)}`).join('\n')
        });
    }

    return embed;
}

function createEvolutionEmbed(evolutionData) {
    if (evolutionData.length <= 1) return null;

    const embed = new EmbedBuilder()
        .setTitle(`⚡ ${capitalizeFirst(evolutionData[0])} - Evolution Line`)
        .setColor('#FFD700')
        .addFields({
            name: '📈 Evolution Chain',
            value: evolutionData.map(name => capitalizeFirst(name)).join(' ➜ ')
        });

    return embed;
}

function createNavigationButtons(pages, currentPage = 0, disabled = false) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel(`◀️ ${pages[(currentPage - 1 + pages.length) % pages.length].name}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel(`${pages[(currentPage + 1) % pages.length].name} ▶️`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled)
        );
}

function getTypeColor(type) {
    const colors = {
        normal: '#A8A878', fire: '#F08030', water: '#6890F0',
        electric: '#F8D030', grass: '#78C850', ice: '#98D8D8',
        fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
        flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
        rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
        dark: '#705848', steel: '#B8B8D0', fairy: '#EE99AC'
    };
    return colors[type] || '#68A090';
}

function getTypeEmoji(type) {
    const typeEmojis = {
        normal: '⚪', fire: '🔥', water: '💧', electric: '⚡',
        grass: '🌿', ice: '❄️', fighting: '👊', poison: '☠️',
        ground: '🌍', flying: '🦅', psychic: '🔮', bug: '🐛',
        rock: '🪨', ghost: '👻', dragon: '🐲', dark: '🌑',
        steel: '⚔️', fairy: '🧚'
    };
    return typeEmojis[type] || '❔';
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function fetchEvolutionData(url) {
    const evoResponse = await axios.get(url);
    const evoChain = [];
    let evoData = evoResponse.data.chain;

    do {
        evoChain.push(evoData.species.name);
        evoData = evoData.evolves_to[0];
    } while (evoData && evoData.hasOwnProperty('evolves_to'));

    return evoChain;
}

async function fetchVarieties(varieties) {
    return await Promise.all(
        varieties.map(variety => 
            axios.get(variety.pokemon.url).then(res => ({
                pokemon: variety.pokemon,
                data: res.data
            }))
        )
    );
}

function calculateTypeEffectiveness(types) {
    const weaknesses = new Set();
    const resistances = new Set();
    const immunities = new Set();

    types.forEach(typeObj => {
        const type = typeObj.type.name;
        if (typeEffectiveness[type]) {
            typeEffectiveness[type].weaknesses?.forEach(w => weaknesses.add(w));
            typeEffectiveness[type].resistances?.forEach(r => resistances.add(r));
            typeEffectiveness[type].immunities?.forEach(i => immunities.add(i));
        }
    });

    return { weaknesses, resistances, immunities };
}