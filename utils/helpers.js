const fs = require('fs').promises;
const { clear } = require('console');
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage,registerFont } = require('canvas');
registerFont(path.join(__dirname, '..', 'fonts', 'DisposableDroid BB.ttf'), { family: 'DisposableDroid BB' });




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
async function loadImageFromUrl(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return loadImage(response.data);
}

async function createBattleImage(userData, wildPokemonName, isWildPokemonShiny, wildPokemonLevel) {
    const activePokemon = userData.activePokemon || userData.pokemon[userData.selectedPokemon];
    if (!activePokemon) {
        console.error('No active Pokémon found for user:', userData.id);
        throw new Error('No active Pokémon found');
    }
    
    const userPokemonName = activePokemon.name;
    const isUserPokemonShiny = activePokemon.isShiny;
    const userPokemonLevel = activePokemon.level;
    const width = 719;
    const height = 359;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load and draw background
    const background = await loadImage(path.join(__dirname, 'background.png'));
    ctx.drawImage(background, 0, 0, width, height);

    // Load user Pokemon
    const userPokemonUrl = `https://img.pokemondb.net/sprites/x-y${isUserPokemonShiny ? '/shiny' : '/normal'}/${userPokemonName.toLowerCase()}.png`;
    const userPokemon = await loadImage(userPokemonUrl);

    // Load wild Pokemon
    const wildPokemonUrl1 = `https://img.pokemondb.net/sprites/x-y${isWildPokemonShiny ? '/shiny' : '/normal'}/${wildPokemonName.toLowerCase()}.png`;
    const wildPokemonUrl2 = `https://img.pokemondb.net/sprites/scarlet-violet${isWildPokemonShiny ? '/shiny/1x' : '/normal/1x'}/${wildPokemonName.toLowerCase()}.png`;
    let wildPokemon;
    try {
        wildPokemon = await loadImage(wildPokemonUrl1);
    } catch (error) {
        console.log(`Failed to load image from ${wildPokemonUrl1}, trying fallback URL`);
        try {
            wildPokemon = await loadImage(wildPokemonUrl2);
        } catch (fallbackError) {
            console.error(`Failed to load image from both URLs for ${wildPokemonName}`);
            throw fallbackError;
        }
    }

    // Draw user Pokemon in the bottom left circle
    ctx.drawImage(userPokemon, 50, height - 220, 190, 150);

    // Draw wild Pokemon in the top right
    ctx.drawImage(wildPokemon, width - 250, 20, 150, 150);

    // Add Pokemon names and levels to the boxes
    ctx.fillStyle = '#000000';
    ctx.font = '20px DisposableDroidBB';
    
    // Wild Pokemon (top left box)
    ctx.fillText(wildPokemonName, 100, 60);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`Lv${wildPokemonLevel.toString().padStart(3, '0')}`, 270, 65);
    
    // User Pokemon (bottom right box)
    ctx.font = '20px DisposableDroidBB'; // Reset to larger font for Pokemon name
    ctx.fillText(userPokemonName, width - 220, height - 170);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`Lv${userPokemonLevel.toString().padStart(2, '0')}`, width - 80, height - 165);

    // Return the canvas buffer
    return canvas.toBuffer();
}
async function getActivePokemon(userData) {
    return userData.activePokemon || userData.pokemon[userData.selectedPokemon];
}


async function writeUserData(data) {
    await fs.writeFile(USER_DATA_PATH, JSON.stringify(data, null, 2));
}

async function getUserData(userId) {
    const userData = await readUserData();
    if (userData[userId] && !userData[userId].lastWildEncounter) {
        userData[userId].lastWildEncounter = 0; // Initialize to 0 if not present
        await writeUserData(userData);
    }
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
            caughtPokemon: {},
            selectedPokemon: 0,
            isShiny:{},
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

async function updateCaughtPokemon(userId, pokemonName, isShiny = false) {
    const userData = await readUserData();
    if (!userData[userId]) {
        throw new Error('User does not exist');
    }
    
    if (!userData[userId].caughtPokemon) {
        userData[userId].caughtPokemon = {};
    }
    
    userData[userId].caughtPokemon[pokemonName.toLowerCase()] = { isShiny };
    await writeUserData(userData);
    console.log(`Updated caught Pokémon for user ${userId}: ${pokemonName}, isShiny: ${isShiny}`); // Add this log
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
    const level = Math.min(85, Math.max(1, Math.floor(userLevel + (Math.random() * 10 - 5))));

    return {
        name: randomPokemon.charAt(0).toUpperCase() + randomPokemon.slice(1),
        type: 'Unknown', // You might want to add a type database or API call to get accurate types
        level,
        exp: 0,
        isShiny: isShiny(),
        moves: ['Tackle'], // Add more moves based on the Pokémon and its level
        catchRate: 100 ,
        rarity: getPokemonRarity()
    };
}

function isShiny() {
    return Math.random() < 1 / 50; // Adjust this value to match the correct shiny probability
}
async function updateSelectedPokemon(userId, pokemonIndex) {
    const userData = await getUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }
    if (pokemonIndex < 0 || pokemonIndex >= userData.pokemon.length) {
        throw new Error('Invalid Pokémon index');
    }
    userData.selectedPokemon = pokemonIndex;
    await updateUserData(userId, userData);
    return userData;
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
function getPokemonRarity() {
    const rarities = [
        { emoji: '<:LR:1259113497053233162>', chance: 125/1851 },
        { emoji: '<:n_:1259114941873520734>', chance: 700/1851 },  
        { emoji: '<:U_:1259114756313452680>', chance: 500/1851 },  
        { emoji: '<:r_:1259114608426487839>', chance: 300/1851},  
        { emoji: '<:SR:1259113778747015233>', chance: 250/1851},  
        { emoji: '<:UR:1259113669925539902>', chance: 150/1851 }
         
    ];

    const random = Math.random();
    let cumulativeChance = 0;

    for (const rarity of rarities) {
        cumulativeChance += rarity.chance;
        if (random < cumulativeChance) {
            return rarity.emoji;
        }
    }

    // Fallback to the most common rarity if something goes wrong
    return rarities[0].emoji;
}

function getRandomStarterPokemon(region) {
    const starters = {
        kanto: [
            { name: 'Bulbasaur',rarity:'<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Charmander',rarity:'<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Squirtle', rarity:'<:SR:1259113778747015233>',type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        johto: [
            { name: 'Chikorita', rarity:'<:SR:1259113778747015233>',type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Cyndaquil',rarity:'<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Leer'], catchRate: 45 },
            { name: 'Totodile', rarity:'<:SR:1259113778747015233>',type: 'Water', level: 5, exp: 0, moves: ['Scratch', 'Leer'], catchRate: 45 }
        ],
        // Add more regions and their starters as needed
    };

    const regionStarters = starters[region.toLowerCase()] || starters.kanto;
    return regionStarters[Math.floor(Math.random() * regionStarters.length)];
}

function calculateCatchProbability(pokemon, ballType) {
    const catchRates = {
        pokeball: 0.20,
        greatball: 0.60,
        ultraball: 0.80,
        masterball: 1.00
    };

    return catchRates[ballType] || 0.55; // Default to Poké Ball rate if unknown ball type
}

function attemptCatch(pokemon, ballType) {
    const catchProbability = calculateCatchProbability(pokemon, ballType);
    return Math.random() < catchProbability;
}

async function clearUserBoxPokemonData(userId) {
    try {
        const userData = await getUserData(userId);
        if (!userData) {
            return { success: false, message: 'User data not found.' };
        }

        // Keep only the starter Pokémon (assumed to be the first one)
        const starter = userData.pokemon[0];
        userData.pokemon = [starter];

        // Preserve Pokédex data
        // If you don't have a separate Pokédex field, you might need to adjust this

        await updateUserData(userId, userData);

        return { success: true, message: 'Box Pokémon data cleared successfully, starter and Pokédex data preserved.' };
    } catch (error) {
        console.error('Error clearing user box Pokémon data:', error);
        return { success: false, message: 'An error occurred while clearing box Pokémon data.' };
    }
}


module.exports = {
    getUserData,
    createOrUpdateUser,
    updateUserData,
    getRandomStarterPokemon,
    generateWildPokemon,
    attemptCatch,
    updateCaughtPokemon,
    isShiny,
    getPokemonRarity,
    clearUserBoxPokemonData,
    createBattleImage,
    updateSelectedPokemon,
    getActivePokemon
};
