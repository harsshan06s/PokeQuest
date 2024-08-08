const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createOrUpdateUser, getUserData, starters } = require('../utils/helpers.js');

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

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Pokeventure')
                .setDescription('Welcome to the beautiful world of Pokémon Lyntriz! Select the region where you want to start your journey:')
                .setImage('https://example.com/starters_image.png');

            const rows = [];
            const regionsPerRow = 4;
            for (let i = 0; i < Object.keys(starters).length; i += regionsPerRow) {
                const row = new ActionRowBuilder();
                Object.keys(starters).slice(i, i + regionsPerRow).forEach(region => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`region_${region}`)
                            .setLabel(region.charAt(0).toUpperCase() + region.slice(1))
                            .setStyle(ButtonStyle.Primary)
                    );
                });
                rows.push(row);
            }

            const message = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });

            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                const selectedRegion = i.customId.split('_')[1];
                const regionStarters = starters[selectedRegion];

                const starterEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1)} Region`)
                    .setDescription(`Great choice! Now select your starter Pokémon from the ${selectedRegion} region:`)
                    .setImage(`https://example.com/${selectedRegion}_starters.png`);

                const starterRow = new ActionRowBuilder();
                regionStarters.forEach(starter => {
                    starterRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`starter_${starter.name.toLowerCase()}`)
                            .setLabel(starter.name)
                            .setStyle(ButtonStyle.Secondary)
                    );
                });

                await i.update({ embeds: [starterEmbed], components: [starterRow] });

                const starterCollector = message.createMessageComponentCollector({ filter, time: 30000 });

                starterCollector.on('collect', async starterInteraction => {
                    const selectedStarter = starterInteraction.customId.split('_')[1];
                    const userData = await createOrUpdateUser(userId, selectedRegion, selectedStarter);

                    const responseMessage = `Welcome to your new Pokémon journey in the ${selectedRegion} region! Your starter Pokémon is ${userData.pokemon[0].name}!`;
                    await starterInteraction.update({ content: responseMessage, embeds: [], components: [] });
                    starterCollector.stop();
                });

                starterCollector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.editReply({ content: 'You did not select a starter Pokémon in time. Please try the command again.', embeds: [], components: [] });
                    }
                });
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
