const { SlashCommandBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

const SHOP_ITEMS = [
    { name: 'Pokeball', price: 200, description: 'A device for catching wild Pokémon.' },
    { name: 'Great Ball', price: 600, description: 'A good, high-performance Poké Ball.' },
    { name: 'Ultra Ball', price: 1200, description: 'An ultra-high performance Poké Ball.' },
    { name: 'Master Ball', price: 50000, description: 'The best Ball with the ultimate level of performance.' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View and purchase items from the shop')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View available items in the shop'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase an item from the shop')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item you want to buy')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('The quantity you want to buy')
                        .setRequired(true))),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'view') {
            return this.viewShop(interaction);
        } else if (interaction.options.getSubcommand() === 'buy') {
            return this.buyItem(interaction);
        }
    },

    async viewShop(interaction) {
        const shopList = SHOP_ITEMS.map(item => 
            `${item.name}: ${item.price} coins - ${item.description}`
        ).join('\n');

        await interaction.reply(`Welcome to the Pokémon Shop! Here are our items:\n\n${shopList}`);
    },

    async buyItem(interaction) {
        const itemName = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity');

        const item = SHOP_ITEMS.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (!item) {
            return interaction.reply('Sorry, that item is not available in the shop.');
        }

        const totalCost = item.price * quantity;

        const userData = await getUserData(interaction.user.id);
        if (!userData) {
            return interaction.reply('You need to start your journey first! Use the /start command.');
        }

        if (userData.money < totalCost) {
            return interaction.reply(`You don't have enough money. You need ${totalCost} coins, but you only have ${userData.money} coins.`);
        }

        // Update user's inventory and money
        userData.money -= totalCost;
        userData.items = userData.items || {};
        userData.items[item.name] = (userData.items[item.name] || 0) + quantity;

        await updateUserData(interaction.user.id, userData);

        await interaction.reply(`You've successfully purchased ${quantity} ${item.name}(s) for ${totalCost} coins. You now have ${userData.money} coins left.`);
    }
};