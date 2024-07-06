const fs = require('fs').promises;
const path = require('path');
const { getUserData, updateUserData } = require('./leveling.js');

// Store active trade offers
const tradeOffers = new Map();

async function offerTrade(userId, offeredPokemonName, requestedPokemonName) {
    const userData = await getUserData(userId);
    const offeredPokemon = userData.pokemon.find(p => p.name.toLowerCase() === offeredPokemonName.toLowerCase());

    if (!offeredPokemon) {
        throw new Error("You don't have this Pokémon to offer!");
    }

    tradeOffers.set(userId, {
        offeredPokemon: offeredPokemonName,
        requestedPokemon: requestedPokemonName,
        timestamp: Date.now()
    });

    // Remove expired trade offers (older than 1 hour)
    for (const [key, value] of tradeOffers.entries()) {
        if (Date.now() - value.timestamp > 3600000) {
            tradeOffers.delete(key);
        }
    }

    return `Trade offer created: ${offeredPokemonName} for ${requestedPokemonName}`;
}

async function acceptTrade(acceptingUserId, offeringUserId) {
    const acceptingUserData = await getUserData(acceptingUserId);
    const offeringUserData = await getUserData(offeringUserId);

    const tradeOffer = tradeOffers.get(offeringUserId);
    if (!tradeOffer) {
        throw new Error("No active trade offer from this user.");
    }

    const offeredPokemon = offeringUserData.pokemon.find(p => p.name.toLowerCase() === tradeOffer.offeredPokemon.toLowerCase());
    const requestedPokemon = acceptingUserData.pokemon.find(p => p.name.toLowerCase() === tradeOffer.requestedPokemon.toLowerCase());

    if (!offeredPokemon) {
        throw new Error("The offering user no longer has the offered Pokémon.");
    }

    if (!requestedPokemon) {
        throw new Error("You don't have the requested Pokémon.");
    }

    // Perform the trade
    offeringUserData.pokemon = offeringUserData.pokemon.filter(p => p.name !== offeredPokemon.name);
    offeringUserData.pokemon.push(requestedPokemon);

    acceptingUserData.pokemon = acceptingUserData.pokemon.filter(p => p.name !== requestedPokemon.name);
    acceptingUserData.pokemon.push(offeredPokemon);

    // Update both users' data
    await updateUserData(offeringUserId, { pokemon: offeringUserData.pokemon });
    await updateUserData(acceptingUserId, { pokemon: acceptingUserData.pokemon });

    // Remove the trade offer
    tradeOffers.delete(offeringUserId);

    return `Trade completed! ${offeringUserId} received ${requestedPokemon.name} and ${acceptingUserId} received ${offeredPokemon.name}.`;
}

async function cancelTrade(userId) {
    if (tradeOffers.has(userId)) {
        tradeOffers.delete(userId);
        return "Your trade offer has been cancelled.";
    } else {
        return "You don't have any active trade offers.";
    }
}

async function listTradeOffers() {
    let offerList = "Current Trade Offers:\n";
    for (const [userId, offer] of tradeOffers.entries()) {
        offerList += `User ${userId} offers ${offer.offeredPokemon} for ${offer.requestedPokemon}\n`;
    }
    return offerList;
}

module.exports = {
    offerTrade,
    acceptTrade,
    cancelTrade,
    listTradeOffers
};