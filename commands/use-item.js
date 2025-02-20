const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData, getActivePokemon, useRareCandy, useEvolutionItem } = require('../utils/helpers.js');

// Organize items by category
const SHOP_ITEMS = [
    { id: 5, name: 'Rare Candy', icon: "🍬", category: 'Usable' },
    { id: 6, name: 'Fire Stone', icon: '🔥', category: 'Evolution' },
    { id: 7, name: 'Water Stone', icon: '💧', category: 'Evolution' },
    { id: 8, name: 'Thunder Stone', icon: '⚡', category: 'Evolution' },
    { id: 9, name: 'Leaf Stone', icon: '🍃', category: 'Evolution' },
    { id: 10, name: 'Moon Stone', icon: '🌙', category: 'Evolution' },
    { id: 11, name: 'Sun Stone', icon: '🌞', category: 'Evolution' },
    { id: 12, name: 'Shiny Stone', icon: '✨', category: 'Evolution' },
    { id: 13, name: 'Dusk Stone', icon: '🌑', category: 'Evolution' },
    { id: 14, name: 'Dawn Stone', icon: '🌅', category: 'Evolution' },
    { id: 15, name: 'Ice Stone', icon: '❄️', category: 'Evolution' },
    { id: 16, name: 'Auspicious Armor', icon: '🛡️', category: 'Evolution' },
    { id: 17, name: 'Black Augurite', icon: '⚫', category: 'Evolution' },
    { id: 18, name: 'Chipped Pot', icon: '🍶', category: 'Evolution' },
    { id: 19, name: 'Cracked Pot', icon: '🍶', category: 'Evolution' },
    { id: 20, name: 'Deep Sea Scale', icon: '🐚', category: 'Evolution' },
    { id: 21, name: 'Deep Sea Tooth', icon: '🦷', category: 'Evolution' },
    { id: 22, name: 'Dragon Scale', icon: '🐉', category: 'Evolution' },
    { id: 23, name: 'Dubious Disc', icon: '💽', category: 'Evolution' },
    { id: 24, name: 'Electirizer', icon: '⚡', category: 'Evolution' },
    { id: 25, name: 'Galarica Cuff', icon: '🧬', category: 'Evolution' },
    { id: 26, name: 'Galarica Wreath', icon: '🌿', category: 'Evolution' },
    { id: 27, name: 'King’s Rock', icon: '👑', category: 'Evolution' },
    { id: 28, name: 'Magmarizer', icon: '🔥', category: 'Evolution' },
    { id: 29, name: 'Malicious Armor', icon: '🛡️', category: 'Evolution' },
    { id: 30, name: 'Metal Coat', icon: '⚙️', category: 'Evolution' },
    { id: 31, name: 'Oval Stone', icon: '⚪', category: 'Evolution' },
    { id: 32, name: 'Peat Block', icon: '🌑', category: 'Evolution' },
    { id: 33, name: 'Prism Scale', icon: '🌈', category: 'Evolution' },
    { id: 34, name: 'Protector', icon: '🛡️', category: 'Evolution' },
    { id: 35, name: 'Razor Claw', icon: '🦅', category: 'Evolution' },
    { id: 36, name: 'Razor Fang', icon: '🦷', category: 'Evolution' },
    { id: 37, name: 'Reaper Cloth', icon: '🧥', category: 'Evolution' },
    { id: 38, name: 'Sachet', icon: '🎀', category: 'Evolution' },
    { id: 39, name: 'Scroll of Darkness', icon: '📜', category: 'Evolution' },
    { id: 40, name: 'Scroll of Waters', icon: '📜', category: 'Evolution' },
    { id: 41, name: 'Strawberry Sweet', icon: '🍓', category: 'Evolution' },
    { id: 42, name: 'Sweet Apple', icon: '🍎', category: 'Evolution' },
    { id: 43, name: 'Syrupy Apple', icon: '🍏', category: 'Evolution' },
    { id: 44, name: 'Tart Apple', icon: '🍎', category: 'Evolution' },
    { id: 45, name: 'Upgrade', icon: '💿', category: 'Evolution' },
    { id: 46, name: 'Whipped Dream', icon: '🍨', category: 'Evolution' },
    { id: 47, name: 'Berry Sweet', icon: '🍒', category: 'Evolution' },
    { id: 48, name: 'Love Sweet', icon: '💗', category: 'Evolution' },
    { id: 49, name: 'Star Sweet', icon: '⭐', category: 'Evolution' },
    { id: 50, name: 'Clover Sweet', icon: '🍀', category: 'Evolution' },
    { id: 51, name: 'Flower Sweet', icon: '🌸', category: 'Evolution' },
    { id: 52, name: 'Ribbon Sweet', icon: '🎗️', category: 'Evolution' },
    { id: 53, name: 'Masterpiece Teacup', icon: '🍶', category: 'Evolution' },
    { id: 54, name: 'Unremarkable Teacup', icon: '🍶', category: 'Evolution' },
    { id: 55, name: 'Everstone', icon: '⚪', category: 'Evolution' },
    { id: 56, name: 'Metal Alloy', icon: '🔩', category: 'Evolution' }
];

const filterItemsByCategory = (category, input) => SHOP_ITEMS
    .filter(item => item.category === category && item.name.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 25); // Limit to 25 items for autocomplete

// Function to handle evolution items

module.exports = {
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Use an item')
        // Usable Items Subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('usable')
                .setDescription('Use a consumable item')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The usable item you want to use')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('The quantity of the item to use')
                        .setRequired(false)
                )
        )
        // Evolution Items Subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('evolution')
                .setDescription('Use an evolution item')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The evolution item you want to use')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            const itemIdentifier = interaction.options.getString('item').toLowerCase();
            const quantity = interaction.options.getInteger('quantity') || 1;
            const userData = await getUserData(interaction.user.id);
        
            if (!userData) {
                return interaction.reply('You need to start your journey first! Use the /start command.');
            }
        
            let result;
            try {
                if (subcommand === 'usable') {
                    // Placeholder for usable items logic
                    return interaction.reply('This functionality is not implemented yet.');
                } else if (subcommand === 'evolution') {
                    // Add more detailed logging
                    console.log("User Data:", JSON.stringify(userData, null, 2));
                    console.log("Selected Pokemon Index:", userData.selectedPokemon);
                    console.log("Pokemon at Selected Index:", userData.pokemon[userData.selectedPokemon]);
        
                    result = await useEvolutionItem(interaction.user.id, itemIdentifier);
        
                    if (!result.success) {
                        return interaction.reply(result.message);
                    }
        
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Evolution Successful!')
                        .setDescription(`${result.message}`)
                        .addFields(
                            { name: 'Used Item', value: result.itemUsed, inline: true }
                        );
        
                    return interaction.reply({ embeds: [embed] });
                }
            } catch (error) {
                console.error('Error in use command:', error);
                await interaction.reply(`An error occurred while using the item: ${error.message}`);
            }
        },

    async autocomplete(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const focusedValue = interaction.options.getFocused();
            const category = subcommand === 'usable' ? 'Usable' : 'Evolution';
            const choices = filterItemsByCategory(category, focusedValue)
                .map(item => ({ name: `${item.icon} ${item.name}`, value: item.name.toLowerCase() }));

            await interaction.respond(choices);
        } catch (error) {
            console.error("Autocomplete error:", error);
        }
    }
};
