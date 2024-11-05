const { SlashCommandBuilder } = require('discord.js');
const { getUserData, getActivePokemon, experienceToNextLevel, calculateExperience, updateUserData } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('growthrate')
        .setDescription('Check the growth rate of your active Pokémon')
        .setDMPermission(false),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const userData = await getUserData(userId);

            if (!userData) {
                return interaction.reply({ content: 'Error: User data not found. Please try starting your journey again.', ephemeral: true });
            }

            if (!userData.pokemon || userData.pokemon.length === 0) {
                return interaction.reply({ content: 'Error: You don\'t have any Pokémon. Please start your journey again.', ephemeral: true });
            }

            const activePokemon = await getActivePokemon(userData);

            if (!activePokemon) {
                return interaction.reply({ content: 'Error: Active Pokémon not found. Please try again.', ephemeral: true });
            }

            await updateUserData(userId, { pokemon: userData.pokemon });

            // Calculate experience between current level and next level
            const currentLevelTotalExp = calculateExperience(activePokemon.growthType, activePokemon.level);
            const nextLevelTotalExp = calculateExperience(activePokemon.growthType, activePokemon.level + 1);
            const expNeededForNextLevel = nextLevelTotalExp - currentLevelTotalExp;
            const expToNextLevel = expNeededForNextLevel - activePokemon.exp;

            // Calculate total experience gained throughout existence
            const totalExpGained = currentLevelTotalExp + activePokemon.exp;

            let imgUrl = 'https://play.pokemonshowdown.com/sprites/ani/';
            if (activePokemon.isShiny) {
                imgUrl = 'https://play.pokemonshowdown.com/sprites/ani-shiny/';
            }

            const embed = {
                title: `Growth Rate Checker - ${activePokemon.name}`,
                thumbnail: {
                    url: imgUrl + activePokemon.name.toLowerCase() + '.gif'
                },
                fields: [
                    {
                        name: 'Active Pokémon',
                        value: `**${activePokemon.name}**`,
                        inline: true
                    },
                    {
                        name: 'Growth Type',
                        value: `**${activePokemon.growthType}**`,
                        inline: true
                    },
                    {
                        name: 'Current Level',
                        value: `**Level ${activePokemon.level}**`,
                        inline: true
                    },
                    {
                        name: 'Current Level EXP',
                        value: `**${activePokemon.exp}**`,
                        inline: true
                    },
                    {
                        name: 'Total EXP Gained',
                        value: `**${totalExpGained}**`,
                        inline: true
                    }
                ],
                footer: {
                    text: activePokemon.level === 100 ? 'Congratulations, your Pokémon has reached maximum level!' : 'Keep battling to level up your Pokémon!'
                }
            };
            
            if (activePokemon.level < 100) {
                embed.fields.push({
                    name: 'EXP Needed For Next Level',
                    value: `**${expNeededForNextLevel}**`,
                    inline: true
                });
                embed.fields.push({
                    name: 'Remaining EXP to Level Up',
                    value: `**${expToNextLevel}**`,
                    inline: true
                });
                embed.fields.push({
                    name: 'Growth Rate Description',
                    value: `Your ${activePokemon.name} is level ${activePokemon.level} with ${activePokemon.exp}/${expNeededForNextLevel} EXP for this level. It needs ${expToNextLevel} more EXP to reach level ${activePokemon.level + 1}. Throughout its existence, it has gained a total of ${totalExpGained} EXP.`,
                    inline: false
                });
            } else {
                embed.fields.push({
                    name: 'Growth Rate Description',
                    value: `Your ${activePokemon.name} has reached maximum level 100 and has gained a total of ${totalExpGained} EXP throughout its existence.`,
                    inline: false
                });
            }

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in growthrate command:', error);
            interaction.reply({ content: 'There was an error processing the command. Please try again.', ephemeral: true });
        }
    }
};