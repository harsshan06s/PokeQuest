const { SlashCommandBuilder } = require('discord.js');
const { offerTrade, acceptTrade, cancelTrade, listTradeOffers } = require('../systems/trade.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Pokémon trading commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('offer')
                .setDescription('Offer a Pokémon for trade')
                .addStringOption(option =>
                    option.setName('offer')
                        .setDescription('The Pokémon you want to offer')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('request')
                        .setDescription('The Pokémon you want in return')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a trade offer')
                .addStringOption(option =>
                    option.setName('user')
                        .setDescription('The ID of the user whose offer you want to accept')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel your trade offer'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all current trade offers')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'offer':
                    const offeredPokemon = interaction.options.getString('offer');
                    const requestedPokemon = interaction.options.getString('request');
                    const offerResult = await offerTrade(interaction.user.id, offeredPokemon, requestedPokemon);
                    await interaction.reply(offerResult);
                    break;
                case 'accept':
                    const offeringUserId = interaction.options.getString('user');
                    const acceptResult = await acceptTrade(interaction.user.id, offeringUserId);
                    await interaction.reply(acceptResult);
                    break;
                case 'cancel':
                    const cancelResult = await cancelTrade(interaction.user.id);
                    await interaction.reply(cancelResult);
                    break;
                case 'list':
                    const listResult = await listTradeOffers();
                    await interaction.reply(listResult);
                    break;
                default:
                    await interaction.reply('Invalid subcommand.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error executing this command. Please try again.');
        }
    },
};