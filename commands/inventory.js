const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your current inventory and balance'),

    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            const userData = await getUserData(userId);

            if (!userData) {
                return interaction.reply('You need to start your journey first! Use the /start command.');
            }

            const inventoryEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${interaction.user.username}'s Inventory`)
                .setDescription(`Your current balance: ${formatNumber(userData.money)} coins`)
                .addFields(
                    { name: 'Poke balls', value: this.formatInventoryItem(userData.items.pokeball, 'Poke ball') },
                    { name: 'Great Balls', value: this.formatInventoryItem(userData.items.greatball, 'Great Ball') },
                    { name: 'Ultra Balls', value: this.formatInventoryItem(userData.items.ultraball, 'Ultra Ball') },
                    { name: 'Master Balls', value: this.formatInventoryItem(userData.items.masterball, 'Master Ball') },
                    { name: 'Rare Candies', value: this.formatInventoryItem(userData.items.rarecandy, 'Rare Candy') }
                )
                .setFooter({ text: 'Use /shop to purchase more items!' });

            await interaction.reply({ embeds: [inventoryEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error fetching your inventory. Please try again.');
        }
    },

    formatInventoryItem(quantity, itemName) {
        if (!quantity || quantity <= 0) {
            return `You don't have any ${itemName}s.`;
        }
        return `You have ${formatNumber(quantity)} ${itemName}${quantity > 1 ? 's' : ''}.`;
    }
};