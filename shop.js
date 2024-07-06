const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const SHOP_ITEMS = [
    { id: 1, name: 'Pokeball', price: 100,icon: '<:Pokeball:1259115461770084457>'},
    { id: 2, name: 'Greatball', price: 350, icon: "<:Greaball:1259115641080643657>"},
    { id: 3, name: 'Ultraball', price: 550, icon: "<:Ultraball:1259115187990958090>" },
    { id: 4, name: 'Masterball', price: 100000 ,icon: "<:Masterball:1259115795317784627>" }
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

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Poké Mart')
            .setDescription(`You have ${formatNumber(userData.money)} 🪙`)
            .addFields(
                SHOP_ITEMS.map(item => ({
                    name: `#${item.id} ${item.icon} ${item.name}`,
                    value: `${formatNumber(item.price)} coins 🪙`,
                    inline: false
                }))
            )
            .setFooter({ text: `Page 1/1` });

        await interaction.reply({ embeds: [embed] });
    },

    async buyItem(interaction) {
        const itemIdentifier = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity');

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
        userData.items[item.name.toLowerCase()] = (userData.items[item.name.toLowerCase()] || 0) + quantity;

        await updateUserData(interaction.user.id, userData);

        await interaction.reply(`You've successfully purchased ${quantity} ${item.icon} ${item.name}(s) for ${formatNumber(totalCost)} coins. You now have ${formatNumber(userData.money)} coins left.`);
    }
};