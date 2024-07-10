const fs = require('fs').promises;
const path = require('path');
const { getUserData, updateUserData } = require('./leveling.js');

const POKEMON_DATA = require('../pokemon-data.json');

function calculateDamage(attacker, defender, move) {
    // Basic damage calculation
    const attack = attacker.stats.attack;
    const defense = defender.stats.defense;
    const power = move.power;
    const level = attacker.level;

    const damage = Math.floor(((2 * level / 5 + 2) * power * attack / defense) / 50) + 2;
    return damage;
}

function isEffective(moveType, defenderType) {
    // Implement type effectiveness here
    // This is a simplified version
    const effectiveness = {
        'fire': { 'grass': 2, 'water': 0.5 },
        'water': { 'fire': 2, 'grass': 0.5 },
        'grass': { 'water': 2, 'fire': 0.5 },
    };

    return effectiveness[moveType]?.[defenderType] || 1;
}

async function battle(userId, userPokemon, opponentPokemon, isWildBattle = true) {
    let turn = 0;
    const battleLog = [];

    while (userPokemon.hp > 0 && opponentPokemon.hp > 0) {
        turn++;
        battleLog.push(`Turn ${turn}`);

        // User's turn
        const userMove = userPokemon.moves[Math.floor(Math.random() * userPokemon.moves.length)];
        let damage = calculateDamage(userPokemon, opponentPokemon, userMove);
        const effectiveness = isEffective(userMove.type, opponentPokemon.type);
        damage = Math.floor(damage * effectiveness);

        opponentPokemon.hp -= damage;
        battleLog.push(`${userPokemon.name} used ${userMove.name} and dealt ${damage} damage.`);

        if (opponentPokemon.hp <= 0) {
            battleLog.push(`${opponentPokemon.name} fainted. ${userPokemon.name} wins!`);
            break;
        }

        // Opponent's turn
        const opponentMove = opponentPokemon.moves[Math.floor(Math.random() * opponentPokemon.moves.length)];
        damage = calculateDamage(opponentPokemon, userPokemon, opponentMove);
        const opponentEffectiveness = isEffective(opponentMove.type, userPokemon.type);
        damage = Math.floor(damage * opponentEffectiveness);

        userPokemon.hp -= damage;
        battleLog.push(`${opponentPokemon.name} used ${opponentMove.name} and dealt ${damage} damage.`);

        if (userPokemon.hp <= 0) {
            battleLog.push(`${userPokemon.name} fainted. ${opponentPokemon.name} wins!`);
            break;
        }
    }

    // Calculate experience and potential level up
    if (userPokemon.hp > 0) {
        const expGained = Math.floor(opponentPokemon.baseExp * opponentPokemon.level / 7);
        userPokemon.exp += expGained;
        battleLog.push(`${userPokemon.name} gained ${expGained} experience.`);

        // Check for level up
        const expForNextLevel = Math.pow(userPokemon.level + 1, 3);
        if (userPokemon.exp >= expForNextLevel) {
            userPokemon.level++;
            battleLog.push(`${userPokemon.name} leveled up to level ${userPokemon.level}!`);
        }

        // Update user data
        const userData = await getUserData(userId);
        const pokemonIndex = userData.pokemon.findIndex(p => p.name === userPokemon.name);
        if (pokemonIndex !== -1) {
            userData.pokemon[pokemonIndex] = userPokemon;
            await updateUserData(userId, { pokemon: userData.pokemon });
        }

        // If it's a wild battle and the user won, give them a chance to catch the Pokémon
        if (isWildBattle) {
            const catchChance = (1 - (opponentPokemon.hp / opponentPokemon.maxHp)) * 0.5;
            if (Math.random() < catchChance) {
                userData.pokemon.push(opponentPokemon);
                await updateUserData(userId, { pokemon: userData.pokemon });
                battleLog.push(`You caught ${opponentPokemon.name}!`);
            } else {
                battleLog.push(`${opponentPokemon.name} escaped!`);
            }
        }
    }

    return battleLog;
}

async function initiateBattle(userId, userPokemonName, opponentPokemonName = null, isWildBattle = true) {
    const userData = await getUserData(userId);
    const userPokemon = userData.pokemon.find(p => p.name.toLowerCase() === userPokemonName.toLowerCase());

    if (!userPokemon) {
        throw new Error("You don't have this Pokémon!");
    }

    let opponentPokemon;
    if (isWildBattle) {
        // For wild battles, if no specific opponent is given, choose a random Pokémon
        const wildPokemonNames = Object.keys(POKEMON_DATA);
        opponentPokemonName = opponentPokemonName || wildPokemonNames[Math.floor(Math.random() * wildPokemonNames.length)];
        opponentPokemon = { ...POKEMON_DATA[opponentPokemonName], hp: POKEMON_DATA[opponentPokemonName].stats.hp };
    } else {
        // For trainer battles, you'd need to implement a way to get the opponent's Pokémon
        // This is just a placeholder
        opponentPokemon = { ...POKEMON_DATA[opponentPokemonName], hp: POKEMON_DATA[opponentPokemonName].stats.hp };
    }

    return battle(userId, userPokemon, opponentPokemon, isWildBattle);
}

module.exports = {
    initiateBattle
};