const fs = require('fs');
const path = require('path');

const pokemonData = require('../pokemon-data.json');
const CAUGHT_POKEMON_FILE = path.join(__dirname, '..', 'data', 'caughtPokemon.json');

// Load caught Pokémon data
function loadCaughtPokemon() {
    if (fs.existsSync(CAUGHT_POKEMON_FILE)) {
        const data = fs.readFileSync(CAUGHT_POKEMON_FILE, 'utf8');
        return new Map(JSON.parse(data));
    }
    return new Map();
}

// Save caught Pokémon data
function saveCaughtPokemon(caughtPokemons) {
    const jsonData = JSON.stringify(Array.from(caughtPokemons.entries()));
    fs.writeFileSync(CAUGHT_POKEMON_FILE, jsonData);
}

let caughtPokemons = loadCaughtPokemon();

function expForLevel(level) {
    return Math.floor(Math.pow(level, 3) * (100 - level) / 50);
}

function addXP(userId, pokemonName, xpGained) {
    const pokemon = getPokemonInfo(userId, pokemonName);
    if (!pokemon) return null;

    pokemon.xp += xpGained;
    
    let leveledUp = false;
    while (pokemon.xp >= expForLevel(pokemon.level + 1)) {
        pokemon.level++;
        leveledUp = true;
    }

    saveCaughtPokemon(caughtPokemons);

    return {
        newXP: pokemon.xp,
        newLevel: pokemon.level,
        leveledUp,
        xpToNextLevel: expForLevel(pokemon.level + 1) - pokemon.xp
    };
}

function getPokemonInfo(userId, pokemonName) {
    const userBox = caughtPokemons.get(userId) || [];
    return userBox.find(p => p.name.toLowerCase() === pokemonName.toLowerCase());
}

function catchPokemon(userId, pokemonName) {
    if (!pokemonData[pokemonName]) return false;

    let userBox = caughtPokemons.get(userId);
    if (!userBox) {
        userBox = [];
        caughtPokemons.set(userId, userBox);
    }

    const newPokemon = {
        name: pokemonName,
        level: 1,
        xp: 0,
        ...pokemonData[pokemonName]
    };

    userBox.push(newPokemon);
    saveCaughtPokemon(caughtPokemons);
    return true;
}

function getUserPokemons(userId) {
    return caughtPokemons.get(userId) || [];
}

module.exports = {
    addXP,
    getPokemonInfo,
    catchPokemon,
    getUserPokemons
};