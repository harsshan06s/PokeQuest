const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const SHOP_ITEMS = [
    { id: 1, name: 'Pokeball', price: 100, icon: '<:Pokeball:1259115461770084457>', category: 'Pokeballs'},
    { id: 2, name: 'Greatball', price: 350, icon: "<:Greaball:1259115641080643657>", category: 'Pokeballs'},
    { id: 3, name: 'Ultraball', price: 550, icon: "<:Ultraball:1259115187990958090>", category: 'Pokeballs' },
    { id: 4, name: 'Masterball', price: 100000, icon: "<:Masterball:1259115795317784627>", category: 'Pokeballs' },
    { id: 5, name: 'Rare Candy', price: 5000, icon: "🍬", category: 'Usable' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View and purchase items from the shop')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View available items in the shop')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The category of items to view')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All', value: 'all' },
                            { name: 'Pokeballs', value: 'pokeballs' },
                            { name: 'Usable', value: 'usable' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase an item from the shop')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item ID or name you want to buy')
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
        const userData = await getUserData(interaction.user.id);
        if (!userData) {
            return interaction.reply('You need to start your journey first! Use the /start command.');
        }

        const category = interaction.options.getString('category') || 'all';
        let filteredItems = SHOP_ITEMS;
        if (category !== 'all') {
            filteredItems = SHOP_ITEMS.filter(item => item.category.toLowerCase() === category);
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Poké Mart')
            .setDescription(`You have ${formatNumber(userData.money)} 🪙`)
            .addFields(
                filteredItems.map(item => ({
                    name: `#${item.id} ${item.icon} ${item.name}`,
                    value: `${formatNumber(item.price)} coins 🪙`,
                    inline: false
                }))
            )
            .setFooter({ text: `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}` });

        await interaction.reply({ embeds: [embed] });
    },

    async buyItem(interaction) {
        const itemIdentifier = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity');

        if (quantity <= 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Invalid Quantity')
                .setDescription('Oops! Looks like you are trying to buy thin air.\n Our Pokémon arent that invisible yet! Please enter a positive quantity.');
            return interaction.reply({ embeds: [embed] });
        }

        const item = SHOP_ITEMS.find(i => 
            i.id.toString() === itemIdentifier || 
            i.name.toLowerCase() === itemIdentifier.toLowerCase()
        );

        if (!item) {
            return interaction.reply('Sorry, that item is not available in the shop.');
        }

        const totalCost = item.price * quantity;

        const userData = await getUserData(interaction.user.id);
        if (!userData) {
            return interaction.reply('You need to start your journey first! Use the /start command.');
        }

        if (userData.money < totalCost) {
            return interaction.reply(`You don't have enough money. You need ${formatNumber(totalCost)} coins, but you only have ${formatNumber(userData.money)} coins.`);
        }

        // Update user's inventory and money
        userData.money -= totalCost;
        userData.items = userData.items || {};
    
    // Use a consistent key for Rare Candy
     const itemKey = item.name.toLowerCase() === 'rare candy' ? 'rarecandy' : item.name.toLowerCase();

     userData.items[itemKey] = (userData.items[itemKey] || 0) + quantity;

     console.log('Updated user data:', JSON.stringify(userData, null, 2));

     await updateUserData(interaction.user.id, userData);

     await interaction.reply(`You've successfully purchased ${quantity} ${item.icon} ${item.name}(s) for ${formatNumber(totalCost)} coins. You now have ${formatNumber(userData.money)} coins left.`);
    }
};