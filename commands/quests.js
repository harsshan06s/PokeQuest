const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData } = require('../utils/helpers.js'); // Load user data function

// Region configuration
const regions = {
    kanto: { name: "Kanto", requiredPokemon: 100, nextRegion: "johto" },
    johto: { name: "Johto", requiredPokemon: 80, nextRegion: "hoenn" },
    hoenn: { name: "Hoenn", requiredPokemon: 70, nextRegion: "sinnoh" },
    sinnoh: { name: "Sinnoh", requiredPokemon: 60, nextRegion: "unova" },
    unova: { name: "Unova", requiredPokemon: 50, nextRegion: "kalos" },
    kalos: { name: "Kalos", requiredPokemon: 40, nextRegion: "alola" },
    alola: { name: "Alola", requiredPokemon: 30, nextRegion: "galar" },
    galar: { name: "Galar", requiredPokemon: 20, nextRegion: null } // Final region
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('Check your progress and quests for unlocking the next region.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Fetch user data
            const userData = await getUserData(userId);
            if (!userData) {
                return interaction.reply("You don't have any data yet! Start your journey with `/start`.");
            }

            const currentRegion = userData.region || "kanto";
            const regionConfig = regions[currentRegion];
            const caughtPokemonCount = Object.keys(userData.caughtPokemon || {}).length;

            // Build the progress message
            const progress = Math.min(caughtPokemonCount, regionConfig.requiredPokemon);
            const progressPercentage = ((progress / regionConfig.requiredPokemon) * 100).toFixed(1);

            // Check if the next region exists
            const nextRegionName = regionConfig.nextRegion ? regions[regionConfig.nextRegion].name : "None (All regions completed!)";

            // Embed to show the progress visually
            const progressEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🌟 Your Quest Progress 🌟')
                .setDescription(`**Region**: ${regionConfig.name}`)
                .addFields(
                    { name: 'Pokémon Caught', value: `${progress} / ${regionConfig.requiredPokemon}`, inline: true },
                    { name: 'Progress', value: `${progressPercentage}%`, inline: true },
                    { name: 'Next Region', value: nextRegionName, inline: false }
                )
                .setFooter({ text: 'Keep catching Pokémon to unlock the next region!' });

            await interaction.reply({ embeds: [progressEmbed] });
        } catch (error) {
            console.error(`Error in /quests command for user ${userId}:`, error);
            return interaction.reply("An error occurred while fetching your quest progress. Please try again.");
        }
    },
};
