const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, updateUserData } = require('../utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Pokémon and money trading commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Offer a Pokémon for trade')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to trade with')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('pokemon')
                        .setDescription('The ID of the Pokémon from your box')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('money')
                .setDescription('Offer money for trade')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to trade with')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('The amount of money to trade')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a trade offer'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel your trade offer')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'send':
                    await handleSendTrade(interaction);
                    break;
                case 'money':
                    await handleMoneyTrade(interaction);
                    break;
                case 'accept':
                    await handleAcceptTrade(interaction);
                    break;
                case 'cancel':
                    await handleCancelTrade(interaction);
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

async function handleSendTrade(interaction) {
    const targetUser = interaction.options.getUser('user');
    const pokemonId = interaction.options.getInteger('pokemon');
    const userData = await getUserData(interaction.user.id);

    if (!userData || !userData.pokemon || pokemonId > userData.pokemon.length) {
        return interaction.reply('Invalid Pokémon ID or you don\'t have that Pokémon');
    }

    const offeredPokemon = userData.pokemon[pokemonId - 1];
    
    // Initialize global.activeTradeOffers if it doesn't exist
    if (!global.activeTradeOffers) {
        global.activeTradeOffers = [];
    }

    // Check if there's an existing trade offer
    const existingOffer = global.activeTradeOffers.find(offer => 
        (offer.toUser === interaction.user.id && offer.fromUser === targetUser.id) ||
        (offer.fromUser === interaction.user.id && offer.toUser === targetUser.id)
    );

    if (existingOffer) {
        // This is a response to an existing trade offer
        if (interaction.user.id === existingOffer.toUser) {
            existingOffer.recipientPokemon = {
                name: offeredPokemon.name,
                level: offeredPokemon.level,
                rarity: offeredPokemon.rarity,
                isShiny: offeredPokemon.isShiny
            };
            existingOffer.acceptedByTo = true;
            await interaction.reply(`You've offered your ${offeredPokemon.name} in response to the trade. Waiting for the other user to confirm.`);
        } else {
            await interaction.reply('There\'s already an active trade offer. Please use /trade accept to accept it or /trade cancel to cancel it.');
        }
    } else {
        // This is a new trade offer
        const tradeOffer = {
            type: 'pokemon',
            fromUser: interaction.user.id,
            toUser: targetUser.id,
            pokemon: {
                name: offeredPokemon.name,
                level: offeredPokemon.level,
                rarity: offeredPokemon.rarity,
                isShiny: offeredPokemon.isShiny
            },
            recipientPokemon: null,
            acceptedByFrom: false,
            acceptedByTo: false
        };

        global.activeTradeOffers = global.activeTradeOffers || [];
        global.activeTradeOffers.push(tradeOffer);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Trade Offer')
            .setDescription(`${interaction.user.username} wants to trade with ${targetUser.username}`)
            .addFields(
                { name: 'Offered Pokémon', value: `${offeredPokemon.rarity} ${offeredPokemon.name} (LVL ${offeredPokemon.level})` },
                { name: 'To Accept', value: `Use the /trade send command to offer a Pokémon in return` }
            );

        await interaction.reply({ embeds: [embed], content: `<@${targetUser.id}>` });
    }
}
function getPokemonImageUrl(pokemonName, isShiny) {
    let imgUrl = 'https://play.pokemonshowdown.com/sprites/ani/';

    if (isShiny) {
        imgUrl = 'https://play.pokemonshowdown.com/sprites/ani-shiny/';
    }

    imgUrl += `${pokemonName.toLowerCase()}.gif`;

    return imgUrl;
}

async function handleMoneyTrade(interaction) {
    const targetUser = interaction.options.getUser('user');
    const quantity = interaction.options.getInteger('quantity');
    const userData = await getUserData(interaction.user.id);

    if (!userData || userData.money < quantity) {
        return interaction.reply('You don\'t have enough money for this trade.');
    }

    const tradeOffer = {
        type: 'money',
        fromUser: interaction.user.id,
        toUser: targetUser.id,
        amount: quantity,
        acceptedByFrom: false,
        acceptedByTo: false
    };

    global.activeTradeOffers = global.activeTradeOffers || [];
    global.activeTradeOffers.push(tradeOffer);

    await interaction.reply(`You've offered ${quantity} money to ${targetUser.username} for trade.`);
}

async function handleAcceptTrade(interaction) {
    if (!global.activeTradeOffers) {
        global.activeTradeOffers = [];
    }
    const activeOffer = global.activeTradeOffers.find(offer => 
        offer.toUser === interaction.user.id || offer.fromUser === interaction.user.id
    );

    if (!activeOffer) {
        return interaction.reply('You have no active trade offers.');
    }

    let replyMessage = '';

    if (!activeOffer.acceptedByTo && interaction.user.id === activeOffer.toUser) {
        // Recipient is accepting, so we need to get their Pokémon
        const userData = await getUserData(interaction.user.id);
        
        // Ask the user which Pokémon they want to trade
        await interaction.reply('Which Pokémon do you want to offer? Please use the /trade send command to specify the Pokémon ID.');
        
        // We'll need to implement a way to wait for the user's response
        // This could be done by creating a separate command or modifying the current one
        // For now, we'll just return and wait for the user to use the /trade send command
        return;
    } else if (!activeOffer.acceptedByFrom && interaction.user.id === activeOffer.fromUser) {
        activeOffer.acceptedByFrom = true;
        replyMessage = 'You have confirmed the trade. Waiting for the other user to accept.';
    } else {
        replyMessage = 'You have already accepted this trade. Waiting for the other user.';
    }

    await interaction.reply(replyMessage);

    if (activeOffer.acceptedByTo && activeOffer.acceptedByFrom) {
        try {
            await executePokemonTrade(activeOffer);
            global.activeTradeOffers = global.activeTradeOffers.filter(offer => offer !== activeOffer);
            await interaction.followUp('Trade completed successfully!');
        } catch (error) {
            console.error(error);
            await interaction.followUp(`An error occurred while executing the trade: ${error.message}`);
        }
    }
}

async function executePokemonTrade(offer) {
    const fromUserData = await getUserData(offer.fromUser);
    const toUserData = await getUserData(offer.toUser);

    // Find and remove the Pokémon from the sender's box
    const senderPokemonIndex = fromUserData.pokemon.findIndex(p => 
        p.name === offer.pokemon.name && 
        p.level === offer.pokemon.level && 
        p.rarity === offer.pokemon.rarity
    );
    if (senderPokemonIndex === -1) {
        console.error("Sender's Pokémon not found. Offer:", offer, "Sender's Pokémon:", fromUserData.pokemon);
        throw new Error(`Sender's Pokémon (${offer.pokemon.name}) not found in their box.`);
    }
    const [senderPokemon] = fromUserData.pokemon.splice(senderPokemonIndex, 1);

    // Find and remove the Pokémon from the recipient's box
    const recipientPokemonIndex = toUserData.pokemon.findIndex(p => 
        p.name === offer.recipientPokemon.name && 
        p.level === offer.recipientPokemon.level && 
        p.rarity === offer.recipientPokemon.rarity
    );
    if (recipientPokemonIndex === -1) {
        console.error("Recipient's Pokémon not found. Offer:", offer, "Recipient's Pokémon:", toUserData.pokemon);
        throw new Error(`Recipient's Pokémon (${offer.recipientPokemon.name}) not found in their box.`);
    }
    const [recipientPokemon] = toUserData.pokemon.splice(recipientPokemonIndex, 1);

    // Add the traded Pokémon to each user's box
    toUserData.pokemon.push(senderPokemon);
    fromUserData.pokemon.push(recipientPokemon);

    // Update both users' data
    await updateUserData(offer.fromUser, fromUserData);
    await updateUserData(offer.toUser, toUserData);

    console.log(`Trade executed: ${offer.fromUser} sent ${senderPokemon.name}, ${offer.toUser} sent ${recipientPokemon.name}`);
}

async function handleCancelTrade(interaction) {
    if (!global.activeTradeOffers) {
        global.activeTradeOffers = [];
    }
    const activeOffer = global.activeTradeOffers.find(offer => offer.fromUser === interaction.user.id);

    if (!activeOffer) {
        return interaction.reply('You have no active trade offers to cancel.');
    }

    global.activeTradeOffers = global.activeTradeOffers.filter(offer => offer !== activeOffer);

    await interaction.reply('Your trade offer has been cancelled.');
}