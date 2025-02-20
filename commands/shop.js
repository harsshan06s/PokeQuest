const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const PRICE = 1000;
const ITEMS_PER_PAGE = 10;

const SHOP_ITEMS = [
    { id: 1, name: 'Pokeball', price: 100, icon: '<:Pokeball:1259115461770084457>', category: 'Pokeballs' },
    { id: 2, name: 'Greatball', price: 350, icon: "<:Greaball:1259115641080643657>", category: 'Pokeballs' },
    { id: 3, name: 'Ultraball', price: 550, icon: "<:Ultraball:1259115187990958090>", category: 'Pokeballs' },
    { id: 4, name: 'Masterball', price: 100000, icon: "<:Masterball:1259115795317784627>", category: 'Pokeballs' },
    { id: 5, name: 'Rare Candy', price: 5000, icon: "🍬", category: 'Usable' },
    { id: 6, name: 'Fire Stone', price: PRICE, icon: '🔥', category: 'Evolution' },
    { id: 7, name: 'Water Stone', price: PRICE, icon: '💧', category: 'Evolution' },
    { id: 8, name: 'Thunder Stone', price: PRICE, icon: '⚡', category: 'Evolution' },
    { id: 9, name: 'Leaf Stone', price: PRICE, icon: '🍃', category: 'Evolution' },
    { id: 10, name: 'Moon Stone', price: PRICE, icon: '🌙', category: 'Evolution' },
    { id: 11, name: 'Sun Stone', price: PRICE, icon: '🌞', category: 'Evolution' },
    { id: 12, name: 'Shiny Stone', price: PRICE, icon: '✨', category: 'Evolution' },
    { id: 13, name: 'Dusk Stone', price: PRICE, icon: '🌑', category: 'Evolution' },
    { id: 14, name: 'Dawn Stone', price: PRICE, icon: '🌅', category: 'Evolution' },
    { id: 15, name: 'Ice Stone', price: PRICE, icon: '❄️', category: 'Evolution' },
    { id: 16, name: 'Auspicious Armor', price: PRICE, icon: '🛡️', category: 'Evolution' },
    { id: 17, name: 'Black Augurite', price: PRICE, icon: '⚫', category: 'Evolution' },
    { id: 18, name: 'Chipped Pot', price: PRICE, icon: '🍶', category: 'Evolution' },
    { id: 19, name: 'Cracked Pot', price: PRICE, icon: '🍶', category: 'Evolution' },
    { id: 20, name: 'Deep Sea Scale', price: PRICE, icon: '🐚', category: 'Evolution' },
    { id: 21, name: 'Deep Sea Tooth', price: PRICE, icon: '🦷', category: 'Evolution' },
    { id: 22, name: 'Dragon Scale', price: PRICE, icon: '🐉', category: 'Evolution' },
    { id: 23, name: 'Dubious Disc', price: PRICE, icon: '💽', category: 'Evolution' },
    { id: 24, name: 'Electirizer', price: PRICE, icon: '⚡', category: 'Evolution' },
    { id: 25, name: 'Galarica Cuff', price: PRICE, icon: '🧬', category: 'Evolution' },
    { id: 26, name: 'Galarica Wreath', price: PRICE, icon: '🌿', category: 'Evolution' },
    { id: 27, name: 'King’s Rock', price: PRICE, icon: '👑', category: 'Evolution' },
    { id: 28, name: 'Magmarizer', price: PRICE, icon: '🔥', category: 'Evolution' },
    { id: 29, name: 'Malicious Armor', price: PRICE, icon: '🛡️', category: 'Evolution' },
    { id: 30, name: 'Metal Coat', price: PRICE, icon: '⚙️', category: 'Evolution' },
    { id: 31, name: 'Oval Stone', price: PRICE, icon: '⚪', category: 'Evolution' },
    { id: 32, name: 'Peat Block', price: PRICE, icon: '🌑', category: 'Evolution' },
    { id: 33, name: 'Prism Scale', price: PRICE, icon: '🌈', category: 'Evolution' },
    { id: 34, name: 'Protector', price: PRICE, icon: '🛡️', category: 'Evolution' },
    { id: 35, name: 'Razor Claw', price: PRICE, icon: '🦅', category: 'Evolution' },
    { id: 36, name: 'Razor Fang', price: PRICE, icon: '🦷', category: 'Evolution' },
    { id: 37, name: 'Reaper Cloth', price: PRICE, icon: '🧥', category: 'Evolution' },
    { id: 38, name: 'Sachet', price: PRICE, icon: '🎀', category: 'Evolution' },
    { id: 39, name: 'Scroll of Darkness', price: PRICE, icon: '📜', category: 'Evolution' },
    { id: 40, name: 'Scroll of Waters', price: PRICE, icon: '📜', category: 'Evolution' },
    { id: 41, name: 'Strawberry Sweet', price: PRICE, icon: '🍓', category: 'Evolution' },
    { id: 42, name: 'Sweet Apple', price: PRICE, icon: '🍎', category: 'Evolution' },
    { id: 43, name: 'Syrupy Apple', price: PRICE, icon: '🍏', category: 'Evolution' },
    { id: 44, name: 'Tart Apple', price: PRICE, icon: '🍎', category: 'Evolution' },
    { id: 45, name: 'Upgrade', price: PRICE, icon: '💿', category: 'Evolution' },
    { id: 46, name: 'Whipped Dream', price: PRICE, icon: '🍨', category: 'Evolution' },
    { id: 47, name: 'Berry Sweet', price: PRICE, icon: '🍒', category: 'Evolution' },
    { id: 48, name: 'Love Sweet', price: PRICE, icon: '💗', category: 'Evolution' },
    { id: 49, name: 'Star Sweet', price: PRICE, icon: '⭐', category: 'Evolution' },
    { id: 50, name: 'Clover Sweet', price: PRICE, icon: '🍀', category: 'Evolution' },
    { id: 51, name: 'Flower Sweet', price: PRICE, icon: '🌸', category: 'Evolution' },
    { id: 52, name: 'Ribbon Sweet', price: PRICE, icon: '🎗️', category: 'Evolution' },
    { id: 53, name: 'Masterpiece Teacup', price: PRICE, icon: '🍶', category: 'Evolution' },
    { id: 54, name: 'Unremarkable Teacup', price: PRICE, icon: '🍶', category: 'Evolution' },
    { id: 55, name: 'Everstone', price: PRICE, icon: '⚪', category: 'Evolution' },
    { id: 56, name: 'Metal Alloy', price: PRICE, icon: '🔩', category: 'Evolution' }
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
                            { name: 'Usable', value: 'usable' },
                            { name: 'Evolution', value: 'evolution' }
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
                        .setDescription('How many of the item you want to buy')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'view') {
            return this.viewShop(interaction, 1);
        } else if (interaction.options.getSubcommand() === 'buy') {
            return this.buyItem(interaction);
        }
    },

    async viewShop(interaction, page) {
        try {
            const userData = await getUserData(interaction.user.id);
            if (!userData) {
                return interaction.reply('You need to start your journey first! Use the /start command.');
            }

            const categoryOption = interaction.options.getString('category') || 'all';
            let filteredItems = SHOP_ITEMS;
            if (categoryOption !== 'all') {
                filteredItems = SHOP_ITEMS.filter(item => item.category.toLowerCase() === categoryOption);
            }

            const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
            page = Math.max(1, Math.min(page, totalPages)); // Ensure page is within bounds

            const generateEmbed = (page) => {
                const start = (page - 1) * ITEMS_PER_PAGE;
                const pageItems = filteredItems.slice(start, start + ITEMS_PER_PAGE);

                return new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Poké Mart')
                    .setDescription(`You have ${formatNumber(userData.money)} 🪙`)
                    .addFields(
                        pageItems.map(item => ({
                            name: `#${item.id} ${item.icon} ${item.name}`,
                            value: `${formatNumber(item.price)} coins 🪙`,
                            inline: false
                        }))
                    )
                    .setFooter({ text: `Category: ${categoryOption.charAt(0).toUpperCase() + categoryOption.slice(1)} | Page ${page} of ${totalPages}` });
            };

            const embed = generateEmbed(page);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === totalPages)
                );

            let message;
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components: [row] });
                message = await interaction.fetchReply();
            } else {
                message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            }

            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                await i.deferUpdate();
                
                // Update page number based on button click and regenerate embed
                if (i.customId === 'next' && page < totalPages) {
                    page++;
                } else if (i.customId === 'previous' && page > 1) {
                    page--;
                }

                const updatedEmbed = generateEmbed(page);

                // Update the buttons based on new page
                const updatedRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 1),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages)
                    );

                await message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
            });

            collector.on('end', async () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                        new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(true)
                    );
                await message.edit({ components: [disabledRow] });
            });
        } catch (error) {
            console.error('Error in viewShop:', error);
            await interaction.reply({ content: 'An error occurred. Please try again later.', ephemeral: true });
        }
    },

    async buyItem(interaction) {
        const itemIdentifier = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity');

        if (quantity <= 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Invalid Quantity')
                .setDescription('Oops! Please enter a positive quantity.');
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

        userData.money -= totalCost;
    userData.items = userData.items || {};
    userData.items[item.id] = (userData.items[item.id] || 0) + quantity;

    await updateUserData(interaction.user.id, userData);
    await interaction.reply(`You've successfully purchased ${quantity} ${item.icon} ${item.name}(s) for ${formatNumber(totalCost)} coins. You now have ${formatNumber(userData.money)} coins left.`);
}
}