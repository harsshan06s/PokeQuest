const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, getActivePokemon, useRareCandy } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Use an item')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The item you want to use')
                .setRequired(true)
                .addChoices(
                    { name: 'Rare Candy', value: 'rare candy' }
                ))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('The quantity of the item to use')
                .setRequired(false)),

    async execute(interaction) {
        const itemIdentifier = interaction.options.getString('item').toLowerCase();
        let quantity = interaction.options.getInteger('quantity') || 1;
        const userData = await getUserData(interaction.user.id);

        if (!userData) {
            return interaction.reply('You need to start your journey first! Use the /start command.');
        }

        if (itemIdentifier !== 'rare candy') {
            return interaction.reply('Sorry, you can only use Rare Candy at the moment.');
        }

        if (!userData.items || !userData.items.rarecandy || userData.items.rarecandy < quantity) {
            return interaction.reply(`You don't have enough Rare Candy to use. You have ${userData.items.rarecandy || 0} Rare Candy.`);
        }

        try {
            const activePokemon = await getActivePokemon(userData);
            if (!activePokemon) {
                return interaction.reply("You don't have an active Pokémon selected.");
            }

            // Calculate how many candies are needed to reach level 100
            const candiesNeeded = Math.max(0, 100 - activePokemon.level);

            if (candiesNeeded === 0) {
                return interaction.reply(`${activePokemon.name} is already at maximum level (100). You can't use Rare Candy on it.`);
            }

            // Adjust quantity if it's more than needed
            if (quantity > candiesNeeded) {
                quantity = candiesNeeded;
            }

            const result = await useRareCandy(interaction.user.id, userData.selectedPokemon, quantity);

            // Get the updated user data to show the correct remaining candy count
            const updatedUserData = await getUserData(interaction.user.id);

            const pokemonName = result.pokemon.name.toLowerCase();
            let imgUrl = `https://play.pokemonshowdown.com/sprites/ani/${pokemonName}.gif`;
            
            if (result.pokemon.isShiny) {
                imgUrl = `https://play.pokemonshowdown.com/sprites/ani-shiny/${pokemonName}.gif`;
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Rare Candy Used')
                .setDescription(`You used ${quantity} Rare Candy on ${result.pokemon.name}.`)
                .addFields(
                    { name: 'Old Level', value: result.oldLevel.toString(), inline: true },
                    { name: 'New Level', value: result.newLevel.toString(), inline: true },
                    { name: 'Remaining Rare Candy', value: updatedUserData.items.rarecandy.toString() }
                )
                .setFooter({ text: `${result.pokemon.name}'s level increased!` });

            try {
                embed.setImage(imgUrl);
            } catch (imageError) {
                console.error('Failed to set image:', imageError);
            }

            if (quantity < candiesNeeded) {
                embed.addFields({ name: 'Note', value: `${result.pokemon.name} reached the maximum level (100). ${candiesNeeded - quantity} more Rare Candies would have been wasted.` });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in use command:', error);
            await interaction.reply(`An error occurred while using the item. Please try again later.`);
        }
    }
};