const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont(path.join(__dirname, '..', 'fonts', 'DisposableDroid BB.ttf'), { family: 'DisposableDroid BB' });

const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const POKEMON_LIST_PATH = path.join(__dirname, '..', 'data', 'pokemon-list.json');
const POKEMON_TYPES_PATH = path.join(__dirname, '..', 'data', 'pokemon_types.json');

let pokemonList = [];
let pokemonList1 = {};

// Load Pokémon Lists
async function loadPokemonLists() {
    try {
        const listData = await fs.readFile(POKEMON_LIST_PATH, 'utf8');
        pokemonList = JSON.parse(listData);
        const typesData = await fs.readFile(POKEMON_TYPES_PATH, 'utf8');
        pokemonList1 = JSON.parse(typesData);
    } catch (error) {
        console.error(`Error loading Pokémon lists: ${error}`);
    }
}

// Assign a random growth type to a Pokémon
function assignGrowthType() {
    const growthTypes = ['Erratic', 'Fast', 'MediumFast', 'MediumSlow', 'Slow', 'Fluctuating'];
    return growthTypes[Math.floor(Math.random() * growthTypes.length)];
}

// Function to calculate experience based on growth type
function calculateExperience(growthType, level) {
    switch (growthType) {
        case 'Erratic':
            return erraticExperience(level);
        case 'Fast':
            return fastExperience(level);
        case 'MediumFast':
            return mediumFastExperience(level);
        case 'MediumSlow':
            return mediumSlowExperience(level);
        case 'Slow':
            return slowExperience(level);
        case 'Fluctuating':
            return fluctuatingExperience(level);
        default:
            return mediumFastExperience(level);
    }
}

function fastExperience(level) {
    return 4 * Math.pow(level, 3) / 5;
}

function mediumFastExperience(level) {
    return Math.pow(level, 3);
}

function slowExperience(level) {
    return 5 * Math.pow(level, 3) / 4;
}

function mediumSlowExperience(level) {
    return (6 / 5) * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140;
}

function fluctuatingExperience(level) {
    if (level <= 15) return Math.pow(level, 3) * ((level + 1) / 3 + 24) / 50;
    if (level <= 36) return Math.pow(level, 3) * (level + 14) / 50;
    return Math.pow(level, 3) * (level / 2 + 32) / 50;
}

function erraticExperience(level) {
    if (level <= 50) return Math.pow(level, 3) * (100 - level) / 50;
    if (level <= 68) return Math.pow(level, 3) * (150 - level) / 100;
    if (level <= 98) return Math.pow(level, 3) * Math.floor((1911 - 10 * level) / 3) / 500;
    return Math.pow(level, 3) * (160 - level) / 100;
}

async function loadImageFromUrl(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return loadImage(response.data);
}

// Generate wild Pokémon (with randomized growth type)
function generateWildPokemon(userLevel, userData = {}) {
    if (pokemonList.length === 0) {
        console.error('Pokemon list is empty.');
        return null;
    }

    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const level = Math.floor(Math.random() * 50) + 1;
    const pokemonTypes = pokemonList1[randomPokemon.toLowerCase()] || ['Unknown'];

    return {
        name: randomPokemon.charAt(0).toUpperCase() + randomPokemon.slice(1),
        types: pokemonTypes, 
        level,
        exp: 0, // Initial EXP for wild Pokémon
        isShiny: isShiny(userData),
        moves: ['Tackle'], 
        catchRate: 100, 
        rarity: determineRarity(),
        growthType: assignGrowthType() // Random growth type for wild Pokémon
    };
}

// Shiny probability function
function isShiny(userData) {
    const shinyChance = userData.customChances?.shiny || 0.01; // Default 1% if not set
    return Math.random() < shinyChance;
}
const baseRarities = [
    { emoji: '<:n_:1259114941873520734>', chance: 700/1851 },
    { emoji: '<:U_:1259114756313452680>', chance: 500/1851 },
    { emoji: '<:r_:1259114608426487839>', chance: 300/1851 },
    { emoji: '<:SR:1259113778747015233>', chance: 250/1851 },
    { emoji: '<:UR:1259113669925539902>', chance: 200/1851 },
    { emoji: '<:LR:1259113497053233162>', chance: 100/1851 }
];


function determineRarity() {
    const rand = Math.random();
    let cumulativeChance = 0;
    for (const rarity of baseRarities) {
        cumulativeChance += rarity.chance;
        if (rand < cumulativeChance) {
            return rarity.emoji;
        }
    }
    return baseRarities[baseRarities.length - 1].emoji;
}

// Create or update a user (with growth type integration for starters)
async function createOrUpdateUser(userId, region, selectedStarter) {
    const userData = await readUserData();
    const existingUser = userData[userId];

    if (existingUser) {
        existingUser.region = region;
        existingUser.pokemon.push(selectedStarter);
        existingUser.lastRestart = new Date().toISOString();
    } else {
        userData[userId] = {
            id: userId,
            region: region,
            pokemon: [{
                name: selectedStarter,
                exp: 0,
                growthType: assignGrowthType(), // Assign growth type to starter
                level: 1 // Start at level 1
            }],
            caughtPokemon: {},
            selectedPokemon: 0,
            items: {
                pokeball: 5,
                greatball: 0,
                ultraball: 0,
                masterball: 0,
                rarecandy: 0
            },
            money: 1000,
            lastDaily: null,
            created: new Date().toISOString()
        };
    }

    await writeUserData(userData);
    return userData[userId];
}

// Save user data
async function writeUserData(data) {
    await fs.writeFile(USER_DATA_PATH, JSON.stringify(data, null, 2));
}

// Read user data
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

// Calculate experience needed for next level
function experienceToNextLevel(currentLevel, growthType) {
    return calculateExperience(growthType, currentLevel + 1) - calculateExperience(growthType, currentLevel);
}

// Update user Pokémon data
async function updateUserData(userId, updateData) {
    const userData = await readUserData();
    if (!userData[userId]) {
        throw new Error('User does not exist');
    }

    // Ensure type information is included
    if (updateData.pokemon) {
        updateData.pokemon = updateData.pokemon.map(pokemon => {
            if (!pokemon.types || pokemon.types.length === 0) {
                pokemon.types = pokemonList1[pokemon.name.toLowerCase()] || ['Unknown'];
            }
            return pokemon;
        });
    }

    userData[userId] = { ...userData[userId], ...updateData };
    await writeUserData(userData);
    return userData[userId];
}

// Get active Pokémon with type information
async function getActivePokemon(userData) {
    const activePokemon = userData.activePokemon || userData.pokemon[userData.selectedPokemon];
    if (activePokemon && (!activePokemon.types || activePokemon.types.length === 0)) {
        activePokemon.types = pokemonList1[activePokemon.name.toLowerCase()] || ['Unknown'];
    }
    return activePokemon;
}

// Get user data
async function getUserData(userId) {
    const userData = await readUserData();
    if (userData[userId] && !userData[userId].lastWildEncounter) {
        userData[userId].lastWildEncounter = 0; // Initialize to 0 if not present
        await writeUserData(userData);
    }
    return userData[userId];
}

// Use Rare Candy to level up a Pokémon
async function useRareCandy(userId, pokemonIndex, quantity) {
    const userData = await getUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }

    if (pokemonIndex < 0 || pokemonIndex >= userData.pokemon.length) {
        throw new Error('Invalid Pokémon index');
    }

    if (userData.items.rarecandy < quantity) {
        throw new Error('Not enough Rare Candy');
    }

    const pokemon = userData.pokemon[pokemonIndex];
    const oldLevel = pokemon.level;
    pokemon.level = Math.min(100, pokemon.level + quantity);
    userData.items.rarecandy -= quantity;

    await updateUserData(userId, userData);

    return {
        pokemon: pokemon,
        oldLevel: oldLevel,
        newLevel: pokemon.level,
        usedCandy: quantity
    };
}

// Update caught Pokémon data
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
    return userData[userId];
}

// Update selected Pokémon
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

// Create battle image function (as needed in your game)
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

    const background = await loadImage(path.join(__dirname, 'background.png'));
    ctx.drawImage(background, 0, 0, width, height);

    const userPokemonImagePath = path.join(__dirname, 'pokemon_images', `${userPokemonName.toLowerCase()}${isUserPokemonShiny ? '-shiny' : ''}.png`);
    let userPokemon;
    try {
        userPokemon = await loadImage(userPokemonImagePath);
    } catch (error) {
        userPokemon = await loadImage(path.join(__dirname, 'pokemon_images', 'default.png'));
    }

    const wildPokemonUrl1 = `https://img.pokemondb.net/sprites/x-y${isWildPokemonShiny ? '/shiny' : '/normal'}/${wildPokemonName.toLowerCase()}.png`;
    let wildPokemon;
    try {
        wildPokemon = await loadImage(wildPokemonUrl1);
    } catch (error) {
        wildPokemon = await loadImage(path.join(__dirname, 'pokemon_images', 'default.png'));
    }

    const standardPokemonWidth = 150;
    const standardPokemonHeight = 150;

    const userPokemonX = 100;
    const userPokemonY = height - 190;
    const wildPokemonX = width - 220;
    const wildPokemonY = 40;

    ctx.drawImage(userPokemon, userPokemonX, userPokemonY, standardPokemonWidth, standardPokemonHeight);
    ctx.drawImage(wildPokemon, wildPokemonX, wildPokemonY, standardPokemonWidth, standardPokemonHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px DisposableDroidBB';

    ctx.fillText(wildPokemonName, 70, 70);
    ctx.font = '15px DisposableDroidBB';
    ctx.fillText(`${wildPokemonLevel.toString().padStart(3, '')}`, 220, 75);

    ctx.font = '20px DisposableDroidBB';
    ctx.fillText(userPokemonName, width - 210, height - 70);
    ctx.font = '15px DisposableDroidBB';
    ctx.fillText(`${userPokemonLevel.toString().padStart(2, '')}`, width - 35, height - 67);

    return canvas.toBuffer();
}




// Raid Battle Image Generation
async function createRaidBattleImage(userData, wildPokemonName, isWildPokemonShiny, wildPokemonLevel) {
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
    const backgroundImagePath = path.join(__dirname, 'battle.png');
    let background;
    try {
        background = await loadImage(backgroundImagePath);
    } catch (error) {
        console.error(`Failed to load background image from ${backgroundImagePath}`, error);
        throw error;
    }
    ctx.drawImage(background, 0, 0, width, height);

    // Load user Pokémon image
    const userPokemonImagePath = path.join(__dirname, 'pokemon_images', `${userPokemonName.toLowerCase()}${isUserPokemonShiny ? '-shiny' : ''}.png`);
    let userPokemon;
    try {
        userPokemon = await loadImage(userPokemonImagePath);
    } catch (error) {
        console.error(`Failed to load image for ${userPokemonName}`, error);
        userPokemon = await loadImage(path.join(__dirname, 'pokemon_images', 'default.png'));
    }

    // Load wild Pokémon image
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
            console.error(`Failed to load image from both URLs for ${wildPokemonName}, using fallback image`);
            wildPokemon = await loadImage(path.join(__dirname, 'pokemon_images', 'fallback.png'));
        }
    }

    // Define standard dimensions for both Pokémon
    const standardPokemonWidth = 150;
    const standardPokemonHeight = 150;

    // Calculate position for user Pokémon (bottom left)
    const userPokemonX = 100;
    const userPokemonY = height - 190;

    // Calculate position for wild Pokémon (top right)
    const wildPokemonX = width - 250;
    const wildPokemonY = 40;

    // Draw user Pokémon in the bottom left
    ctx.drawImage(userPokemon, userPokemonX, userPokemonY, standardPokemonWidth, standardPokemonHeight);

    // Draw wild Pokémon in the top right
    ctx.drawImage(wildPokemon, wildPokemonX, wildPokemonY, standardPokemonWidth, standardPokemonHeight);

    // Add Pokémon names and levels to the boxes
    ctx.fillStyle = '#000000';
    ctx.font = '20px DisposableDroidBB';

    // Wild Pokémon (top left box)
    ctx.fillText(wildPokemonName, 100, 45);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`${wildPokemonLevel.toString().padStart(3, '')}`, 250, 47);

    // User Pokémon (bottom right box)
    ctx.font = '20px DisposableDroidBB'; // Reset to larger font for Pokémon name
    ctx.fillText(userPokemonName, width - 210, height - 85);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`Lv${userPokemonLevel.toString().padStart(2, '')}`, width - 120, height - 95);

    // Return the canvas buffer
    return canvas.toBuffer();
}

// Cached battle images for performance
const battleImageCache = new Map();

function getCachedBattleImage(userData, pokemonName, isShiny, level) {
    const cacheKey = `${userData.id}_${pokemonName}_${isShiny}_${level}`;
    return battleImageCache.get(cacheKey);
}

function setCachedBattleImage(userData, pokemonName, isShiny, level, image) {
    const cacheKey = `${userData.id}_${pokemonName}_${isShiny}_${level}`;
    battleImageCache.set(cacheKey, image);
}

// Get Starter Pokémon
function getStarterPokemon(region, starterName) {
    const starters = {
        kanto: [
            { name: 'Bulbasaur', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Charmander', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Squirtle', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        // Add other regions like johto, hoenn, etc.
    };
    
    if (!starters[region]) {
        throw new Error(`Invalid region: ${region}`);
    }

    const regionStarters = starters[region];
    if (!regionStarters || regionStarters.length === 0) {
        throw new Error(`No starter Pokémon defined for region: ${region}`);
    }

    return regionStarters.find(starter => starter.name.toLowerCase() === starterName.toLowerCase()) || regionStarters[0];
}

// Save essential user data
async function saveEssentialUserData(userId, userData) {
    const essentialData = {
        id: userId,
        selectedPokemon: userData.selectedPokemon,
        activePokemon: userData.pokemon[userData.selectedPokemon],
        money: userData.money,
        items: userData.items,
        lastWildEncounter: userData.lastWildEncounter,
        caughtPokemon: userData.caughtPokemon || {} // Include caught Pokémon data
    };

    const filePath = path.join(__dirname, '..', 'data', `${userId}_essential.json`);
    await fs.writeFile(filePath, JSON.stringify(essentialData, null, 2));
}

// Clear user box Pokémon data
async function clearUserBoxPokemonData(userId) {
    try {
        const userData = await getUserData(userId);
        if (!userData) {
            return { success: false, message: 'User data not found.' };
        }

        // Keep only the starter Pokémon (assumed to be the first one)
        const starter = userData.pokemon[0];
        userData.pokemon = [starter];

        // Preserve Pokédex data if necessary

        await updateUserData(userId, userData);

        return { success: true, message: 'Box Pokémon data cleared successfully, starter and Pokédex data preserved.' };
    } catch (error) {
        console.error('Error clearing user box Pokémon data:', error);
        return { success: false, message: 'An error occurred while clearing box Pokémon data.' };
    }
}

// Calculate catch probability
function calculateCatchProbability(pokemon, ballType) {
    const catchRates = {
        pokeball: 0.40,
        greatball: 0.60,
        ultraball: 0.80,
        masterball: 1.00
    };

    return catchRates[ballType] || 0.55; // Default to Poké Ball rate if unknown ball type
}

// Attempt to catch Pokémon
function attemptCatch(pokemon, ballType) {
    const catchProbability = calculateCatchProbability(pokemon, ballType);
    return Math.random() < catchProbability;
}

// Function to handle the level up experience
async function levelUp(userId, pokemonIndex) {
    const userData = await getUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }

    const pokemon = userData.pokemon[pokemonIndex];
    const growthType = pokemon.growthType;
    const currentLevel = pokemon.level;
    const expNeeded = experienceToNextLevel(currentLevel, growthType);

    if (pokemon.exp >= expNeeded) {
        pokemon.level++;
        pokemon.exp -= expNeeded; // Carry over the excess EXP
        await updateUserData(userId, { pokemon: userData.pokemon });
        return `Level up! ${pokemon.name} is now level ${pokemon.level}.`;
    } else {
        return `${pokemon.name} needs more experience to level up.`;
    }
}

// Example Pokémon experience calculation
async function gainExperience(userId, pokemonIndex, experience) {
    const userData = await getUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }

    const pokemon = userData.pokemon[pokemonIndex];
    pokemon.exp += experience;

    await levelUp(userId, pokemonIndex);
    await updateUserData(userId, { pokemon: userData.pokemon });
}

// Function to initialize Pokémon data
function initializePokemonData(pokemonName, level, isShiny) {
    const pokemonData = {
        name: pokemonName,
        level: level,
        exp: 0,
        isShiny: isShiny,
        growthType: assignGrowthType(),
        moves: ['Tackle'], // Default move; can be expanded
        types: pokemonList1[pokemonName.toLowerCase()] || ['Unknown'],
    };
    return pokemonData;
}

// Random Pokémon generation for events or encounters
function randomPokemonEncounter() {
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    const randomPokemonName = pokemonList[randomIndex];
    return randomPokemonName.charAt(0).toUpperCase() + randomPokemonName.slice(1);
}

// Export the functions for use in other files
module.exports = {
    loadPokemonLists,
    createOrUpdateUser,
    generateWildPokemon,
    getUserData,
    useRareCandy,
    updateCaughtPokemon,
    updateSelectedPokemon,
    createBattleImage,
    createRaidBattleImage,
    clearUserBoxPokemonData,
    attemptCatch,
    gainExperience,
    randomPokemonEncounter,
    initializePokemonData,
    getStarterPokemon,
    assignGrowthType,
    calculateCatchProbability,
    experienceToNextLevel,
    isShiny,
    determineRarity,
    setCachedBattleImage,
    getCachedBattleImage,
};
