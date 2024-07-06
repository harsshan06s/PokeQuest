const fs = require('fs').promises;
const path = require('path');

const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const POKEMON_LIST_PATH = path.join(__dirname, '..', 'data', 'pokemon-list.json');

let pokemonList = [];

// Load the Pokémon list when the module is first imported
fs.readFile(POKEMON_LIST_PATH, 'utf8')
    .then(data => {
        pokemonList = JSON.parse(data);
    })
    .catch(error => {
        console.error('Error loading Pokémon list:', error);
    });

async function readUserData() {
    try {
        const data = await fs.readFile(USER_DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function writeUserData(data) {
    await fs.writeFile(USER_DATA_PATH, JSON.stringify(data, null, 2));
}

async function getUserData(userId) {
    const userData = await readUserData();
    return userData[userId];
}

async function createOrUpdateUser(userId, region) {
    const userData = await readUserData();
    const starterPokemon = getRandomStarterPokemon(region);

    if (userData[userId]) {
        // Update existing user
        userData[userId] = {
            ...userData[userId],
            region: region,
            pokemon: [starterPokemon],
            lastRestart: new Date().toISOString()
        };
    } else {
        // Create new user
        userData[userId] = {
            id: userId,
            region: region,
            pokemon: [starterPokemon],
            items: {
                pokeball: 5,
                greatball: 0,
                ultraball: 0,
                masterball: 0
            },
            money: 1000,
            lastDaily: null,
            created: new Date().toISOString()
        };
    }

    await writeUserData(userData);
    return userData[userId];
}

async function updateUserData(userId, updateData) {
    const userData = await readUserData();
    if (!userData[userId]) {
        throw new Error('User does not exist');
    }

    userData[userId] = { ...userData[userId], ...updateData };
    await writeUserData(userData);
    console.log(`Updated user data for ${userId}:`, JSON.stringify(userData[userId], null, 2));
    return userData[userId];
}

function generateWildPokemon(userLevel) {
    if (pokemonList.length === 0) {
        // Fallback to the original implementation if the list isn't loaded
        const fallbackList = [
            { name: 'Pidgey', type: 'Normal/Flying', baseLevel: 2, catchRate: 255 },
            { name: 'Rattata', type: 'Normal', baseLevel: 1, catchRate: 255 },
            { name: 'Caterpie', type: 'Bug', baseLevel: 1, catchRate: 255 },
            { name: 'Weedle', type: 'Bug/Poison', baseLevel: 1, catchRate: 255 },
            { name: 'Pikachu', type: 'Electric', baseLevel: 5, catchRate: 190 },
            { name: 'Slowpoke', type: 'Water/Psychic', baseLevel: 5, catchRate: 190 },
        ];
        return generateFromList(fallbackList, userLevel);
    }

    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const level = Math.max(1, Math.min(100, Math.floor(userLevel + (Math.random() * 5 - 2))));

    return {
        name: randomPokemon.charAt(0).toUpperCase() + randomPokemon.slice(1),
        type: 'Unknown', // You might want to add a type database or API call to get accurate types
        level,
        exp: 0,
        moves: ['Tackle'], // Add more moves based on the Pokémon and its level
        catchRate: 100 // You might want to add a catch rate database or API call for accurate rates
    };
}

function generateFromList(list, userLevel) {
    const pokemon = list[Math.floor(Math.random() * list.length)];
    const level = Math.max(1, Math.min(100, Math.floor(userLevel + (Math.random() * 5 - 2))));

    return {
        ...pokemon,
        level,
        exp: 0,
        moves: ['Tackle'] // Add more moves based on the Pokémon and its level
    };
}

function getRandomStarterPokemon(region) {
    const starters = {
        kanto: [
            { name: 'Bulbasaur', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Charmander', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Squirtle', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        johto: [
            { name: 'Chikorita', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Cyndaquil', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Leer'], catchRate: 45 },
            { name: 'Totodile', type: 'Water', level: 5, exp: 0, moves: ['Scratch', 'Leer'], catchRate: 45 }
        ],
        // Add more regions and their starters as needed
    };

    const regionStarters = starters[region.toLowerCase()] || starters.kanto;
    return regionStarters[Math.floor(Math.random() * regionStarters.length)];
}

function calculateCatchProbability(pokemon, ballType) {
    const ballMultipliers = {
        pokeball: 1,
        greatball: 1.5,
        ultraball: 2,
        masterball: 255
    };

    if (ballType === 'masterball') return 1;

    const a = (3 * pokemon.maxHP - 2 * pokemon.currentHP) * pokemon.catchRate * ballMultipliers[ballType] / (3 * pokemon.maxHP);
    const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));

    return Math.min(b / 65535, 1);
}

function attemptCatch(pokemon, ballType) {
    const catchProbability = calculateCatchProbability(pokemon, ballType);
    return Math.random() < catchProbability;
}

module.exports = {
    getUserData,
    createOrUpdateUser,
    updateUserData,
    getRandomStarterPokemon,
    generateWildPokemon,
    attemptCatch
};