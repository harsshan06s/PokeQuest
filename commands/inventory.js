const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../utils/helpers.js');
const PRICE = 1000


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

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const ITEMS_PER_PAGE = 10;

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

            await this.showInventoryPage(interaction, userData, 'pokeballs', 1);
        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error fetching your inventory. Please try again.');
        }
    },

    async showInventoryPage(interaction, userData, category, page) {
        try {
            switch (category) {
                case 'pokeballs':
                    await this.showPokeballs(interaction, userData, page);
                    break;
                case 'usable':
                    await this.showUsableItems(interaction, userData, page);
                    break;
                case 'evolution':
                    await this.showEvolutionItems(interaction, userData, page);
                    break;
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error fetching your inventory. Please try again.');
        }
    },

    async showPokeballs(interaction, userData, page) {
        const pokeballs = this.getPokeballs(userData);
        const totalPages = Math.ceil(pokeballs.length / ITEMS_PER_PAGE);
        page = Math.max(1, Math.min(page, totalPages)); // Ensure page is within bounds
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = pokeballs.slice(start, start + ITEMS_PER_PAGE);
    
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${interaction.user.username}'s Pokeball Inventory`)
            .setDescription(`Your current balance: ${formatNumber(userData.money)} coins`)
            .addFields(
                pageItems.map(item => ({
                    name: item.name,
                    value: this.formatInventoryItem(userData, item.key),
                    inline: false
                }))
            )
            .setFooter({ text: `Page ${page} of ${totalPages} | Use /inventory to change categories` });
    
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`previous-pokeballs-${page}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`next-pokeballs-${page}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages),
                new ButtonBuilder()
                    .setCustomId('usable')
                    .setLabel('Usable')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('evolution')
                    .setLabel('Evolution')
                    .setStyle(ButtonStyle.Secondary)
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
            if (i.customId === `next-pokeballs-${page}` && page < totalPages) {
                await this.showPokeballs(interaction, userData, page + 1);
            } else if (i.customId === `previous-pokeballs-${page}` && page > 1) {
                await this.showPokeballs(interaction, userData, page - 1);
            } else if (i.customId === 'usable') {
                await this.showInventoryPage(interaction, userData, 'usable', 1);
            } else if (i.customId === 'evolution') {
                await this.showInventoryPage(interaction, userData, 'evolution', 1);
            }
        });
    
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`previous-pokeballs-${page}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId(`next-pokeballs-${page}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('usable').setLabel('Usable').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('evolution').setLabel('Evolution').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
            await interaction.editReply({ components: [disabledRow] });
        });
    },
    
    async showUsableItems(interaction, userData, page) {
        const usableItems = this.getUsableItems(userData);
        const totalPages = Math.ceil(usableItems.length / ITEMS_PER_PAGE);
        page = Math.max(1, Math.min(page, totalPages));
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = usableItems.slice(start, start + ITEMS_PER_PAGE);
    
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${interaction.user.username}'s Usable Items`)
            .setDescription(`Your current balance: ${formatNumber(userData.money)} coins`)
            .addFields(
                pageItems.map(item => ({
                    name: item.name,
                    value: this.formatInventoryItem(userData, item.key),
                    inline: false
                }))
            )
            .setFooter({ text: `Page ${page} of ${totalPages} | Use /inventory to change categories` });
    
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous-usable')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId('next-usable')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages),
                new ButtonBuilder()
                    .setCustomId('pokeballs')
                    .setLabel('Pokeballs')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('evolution')
                    .setLabel('Evolution')
                    .setStyle(ButtonStyle.Secondary)
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
    
            if (i.customId === 'next-usable' && page < totalPages) {
                await this.showUsableItems(interaction, userData, page + 1);
            } else if (i.customId === 'previous-usable' && page > 1) {
                await this.showUsableItems(interaction, userData, page - 1);
            } else if (i.customId === 'pokeballs') {
                await this.showInventoryPage(interaction, userData, 'pokeballs', 1);
            } else if (i.customId === 'evolution') {
                await this.showInventoryPage(interaction, userData, 'evolution', 1);
            }
        });
    
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('previous-usable').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('next-usable').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('pokeballs').setLabel('Pokeballs').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('evolution').setLabel('Evolution').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
            await message.edit({ components: [disabledRow] });
        });
    },
    
    async showEvolutionItems(interaction, userData, page) {
        const evolutionItems = this.getEvolutionItems(userData);
        const totalPages = Math.ceil(evolutionItems.length / ITEMS_PER_PAGE);
        page = Math.max(1, Math.min(page, totalPages));
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = evolutionItems.slice(start, start + ITEMS_PER_PAGE);
    
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${interaction.user.username}'s Evolution Items`)
            .setDescription(`Your current balance: ${formatNumber(userData.money)} coins`)
            .addFields(
                pageItems.map(item => ({
                    name: item.name,
                    value: this.formatInventoryItem(userData, item.key),
                    inline: false
                }))
            )
            .setFooter({ text: `Page ${page} of ${totalPages} | Use /inventory to change categories` });
    
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous-evolution')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId('next-evolution')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages),
                new ButtonBuilder()
                    .setCustomId('pokeballs')
                    .setLabel('Pokeballs')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('usable')
                    .setLabel('Usable')
                    .setStyle(ButtonStyle.Secondary)
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
    
            if (i.customId === 'next-evolution' && page < totalPages) {
                await this.showEvolutionItems(interaction, userData, page + 1);
            } else if (i.customId === 'previous-evolution' && page > 1) {
                await this.showEvolutionItems(interaction, userData, page - 1);
            } else if (i.customId === 'pokeballs') {
                await this.showInventoryPage(interaction, userData, 'pokeballs', 1);
            } else if (i.customId === 'usable') {
                await this.showInventoryPage(interaction, userData, 'usable', 1);
            }
        });
    
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('previous-evolution').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('next-evolution').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('pokeballs').setLabel('Pokeballs').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('usable').setLabel('Usable').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
            await message.edit({ components: [disabledRow] });
        });
    },

    getPokeballs(userData) {
        return [
            { name: 'Pokeball', key: 1 },
            { name: 'Great Ball', key: 2 },
            { name: 'Ultra Ball', key: 3 },
            { name: 'Master Ball', key: 4 }
        ];
    },
    
    getUsableItems(userData) {
        return [
            { name: 'Rare Candy', key: 5 }
        ];
    },
    
    getEvolutionItems(userData) {
        return [
            { name: 'Fire Stone', key: 6 },
            { name: 'Water Stone', key: 7 },
            { name: 'Thunder Stone', key: 8 },
            { name: 'Leaf Stone', key: 9 },
            { name: 'Moon Stone', key: 10 },
            { name: 'Sun Stone', key: 11 },
            { name: 'Shiny Stone', key: 12 },
            { name: 'Dusk Stone', key: 13 },
            { name: 'Dawn Stone', key: 14 },
            { name: 'Ice Stone', key: 15 },
            { name: 'Auspicious Armor', key: 16 },
            { name: 'Black Augurite', key: 17 },
            { name: 'Chipped Pot', key: 18 },
            { name: 'Cracked Pot', key: 19 },
            { name: 'Deep Sea Scale', key: 20 },
            { name: 'Deep Sea Tooth', key: 21 },
            { name: 'Dragon Scale', key: 22 },
            { name: 'Dubious Disc', key: 23 },
            { name: 'Electirizer', key: 24 },
            { name: 'Galarica Cuff', key: 25 },
            { name: 'Galarica Wreath', key: 26 },
            { name: 'King\'s Rock', key: 27 },
            { name: 'Magmarizer', key: 28 },
            { name: 'Malicious Armor', key: 29 },
            { name: 'Metal Coat', key: 30 },
            { name: 'Oval Stone', key: 31 },
            { name: 'Peat Block', key: 32 },
            { name: 'Prism Scale', key: 33 },
            { name: 'Protector', key: 34 },
            { name: 'Razor Claw', key: 35 },
            { name: 'Razor Fang', key: 36 },
            { name: 'Reaper Cloth', key: 37 },
            { name: 'Sachet', key: 38 },
            { name: 'Scroll of Darkness', key: 39 },
            { name: 'Scroll of Waters', key: 40 },
            { name: 'Strawberry Sweet', key: 41 },
            { name: 'Sweet Apple', key: 42 },
            { name: 'Syrupy Apple', key: 43 },
            { name: 'Tart Apple', key: 44 },
            { name: 'Upgrade', key: 45 },
            { name: 'Whipped Dream', key: 46 },
            { name: 'Berry Sweet', key: 47 },
            { name: 'Love Sweet', key: 48 },
            { name: 'Star Sweet', key: 49 },
            { name: 'Clover Sweet', key: 50 },
            { name: 'Flower Sweet', key: 51 },
            { name: 'Ribbon Sweet', key: 52 },
            { name: 'Masterpiece Teacup', key: 53 },
            { name: 'Unremarkable Teacup', key: 54 },
            { name: 'Everstone', key: 55 },
            { name: 'Metal Alloy', key: 56 }
        ];
    },

    
    formatInventoryItem(userData, itemId) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        const quantity = userData.items?.[itemId] || 0;
        if (!item) {
            return `There is no item with ID ${itemId} in the shop.`;
        }
        if (!quantity || quantity <= 0) {
            return `You don't have any ${item.name}s.`;
        }
        return `You have ${formatNumber(quantity)} ${item.name}${quantity > 1 ? 's' : ''}.`;
    }
};