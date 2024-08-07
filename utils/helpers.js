const fs = require('fs').promises;
const { clear } = require('console');
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage,registerFont } = require('canvas');
registerFont(path.join(__dirname, '..', 'fonts', 'DisposableDroid BB.ttf'), { family: 'DisposableDroid BB' });




const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const POKEMON_LIST_PATH = path.join(__dirname, '..', 'data', 'pokemon-list.json');

function getUserFilePath(userId) {
    return path.join(__dirname, '..', 'data', 'users', `${userId}.json`);
}

let pokemonList = [];

// Load the Pokémon list when the module is first imported
fs.readFile(POKEMON_LIST_PATH, 'utf8')
    .then(data => {
        pokemonList = JSON.parse(data);
    })
    .catch(error => {
        console.error('Error loading Pokémon list:', error);
    });

    async function readUserData(userId) {
        const filePath = getUserFilePath(userId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
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
    const userPokemonImagePath = path.join(__dirname, 'pokemon_images', `${userPokemonName.toLowerCase()}${isUserPokemonShiny ? '-shiny' : ''}.png`);
    let userPokemon;
    try {
        userPokemon = await loadImage(userPokemonImagePath);
    } catch (error) {
        console.error(`Failed to load image for ${userPokemonName}`, error);
        // Use a placeholder image or default Pokemon image
        userPokemon = await loadImage(path.join(__dirname, 'pokemon_images', 'default.png'));
    }

    // Load wild Pokemon (keep using URL for now, or implement similar local image loading if needed)
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
// In the createBattleImage function, replace the Pokémon drawing part with:

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

    // Add Pokemon names and levels to the boxes
    ctx.fillStyle = '#000000';
    ctx.font = '20px DisposableDroidBB';
    
    // Wild Pokemon (top left box)
    ctx.fillText(wildPokemonName, 100, 45);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`${wildPokemonLevel.toString().padStart(3, '')}`, 250, 47);
    
    // User Pokemon (bottom right box)
    ctx.font = '20px DisposableDroidBB'; // Reset to larger font for Pokemon name
    ctx.fillText(userPokemonName, width - 250, height - 95);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`Lv${userPokemonLevel.toString().padStart(2, '')}`, width - 120, height - 95);

    // Return the canvas buffer
    return canvas.toBuffer();
}
async function getActivePokemon(userData) {
    return userData.activePokemon || userData.pokemon[userData.selectedPokemon];
}


async function writeUserData(userId, data) {
    const filePath = getUserFilePath(userId);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function getUserData(userId) {
    const userData = await readUserData(userId);
    if (userData && !userData.lastWildEncounter) {
        userData.lastWildEncounter = 0;
        await writeUserData(userId, userData);
    }
    return userData;
}

async function createOrUpdateUser(userId, region) {
    let userData = await readUserData(userId);
    const starterPokemon = getRandomStarterPokemon(region);

    if (userData) {
        // Update existing user
        userData = {
            ...userData,
            region: region,
            pokemon: [starterPokemon],
            lastRestart: new Date().toISOString()
        };
    } else {
        // Create new user
        userData = {
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
                masterball: 0,
                rarecandy: 0
            },
            money: 1000,
            lastDaily: null,
            created: new Date().toISOString()
        };
    }

    await writeUserData(userId, userData);
    return userData;
}
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
async function updateCaughtPokemon(userId, pokemonName, isShiny = false) {
    const userData = await readUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }
    
    if (!userData.caughtPokemon) {
        userData.caughtPokemon = {};
    }
    
    userData.caughtPokemon[pokemonName.toLowerCase()] = { isShiny };
    await writeUserData(userId, userData);
    console.log(`Updated caught Pokémon for user ${userId}: ${pokemonName}, isShiny: ${isShiny}`);
    return userData;
}

async function updateUserData(userId, updateData) {
    const userData = await readUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }

    const updatedUserData = { ...userData, ...updateData };
    await writeUserData(userId, updatedUserData);
    console.log(`Updated user data for ${userId}:`, JSON.stringify(updatedUserData, null, 2));
    return updatedUserData;
}

function generateWildPokemon(userLevel, userData = {}) {
    if (pokemonList.length === 0) {
        // Fallback implementation
        // ...
    }
    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const level = Math.min(85, Math.max(1, Math.floor(userLevel + (Math.random() * 10 - 5))));

    return {
        name: randomPokemon.charAt(0).toUpperCase() + randomPokemon.slice(1),
        type: 'Unknown',
        level,
        exp: 0,
        isShiny: isShiny(userData),
        moves: ['Tackle'],
        catchRate: 100,
        rarity: getCustomRarity(userData)
    };
}
function isShiny(userData) {
    const shinyChance = userData.customChances?.shiny || 0.01; // Default 1% if not set
    return Math.random() < shinyChance;
}
function getCustomRarity(userData = {}) {
    const baseRarity = getPokemonRarity();
    console.log(`Base rarity: ${baseRarity}`);
    
    if (userData.customChances?.rarity) {
        const rarityChance = userData.customChances.rarity;
        console.log(`User has custom rarity chance: ${rarityChance}`);
        
        if (Math.random() < rarityChance) {
            console.log('Custom rarity boost applied');
            const rarities = [
                '<:n_:1259114941873520734>',
                '<:U_:1259114756313452680>',
                '<:r_:1259114608426487839>',
                '<:SR:1259113778747015233>',
                '<:UR:1259113669925539902>',
                '<:LR:1259113497053233162>'
            ];
            
            const currentIndex = rarities.indexOf(baseRarity);
            console.log(`Current rarity index: ${currentIndex}`);
            if (currentIndex < rarities.length - 1) {
                const boostedRarity = rarities[currentIndex + 1];
                console.log(`Boosted rarity: ${boostedRarity}`);
                return boostedRarity;
            }
        } else {
            console.log('Custom rarity boost not applied');
        }
    } else {
        console.log('User does not have custom rarity chance');
    }
    
    console.log(`Returning base rarity: ${baseRarity}`);
    return baseRarity;
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

function generateFromList(list, userLevel, userData) {
    const pokemon = list[Math.floor(Math.random() * list.length)];
    const level = Math.max(1, Math.min(100, Math.floor(userLevel + (Math.random() * 5 - 2))));

    return {
        ...pokemon,
        level,
        exp: 0,
        moves: ['Tackle'], // Add more moves based on the Pokémon and its level
        isShiny: isShiny(userData),
        rarity: getCustomRarity(userData)
    };
}
function getPokemonRarity() {
    const rarities = [
        
        { emoji: '<:n_:1259114941873520734>', chance: 700/1851 },  
        { emoji: '<:U_:1259114756313452680>', chance: 500/1851 },  
        { emoji: '<:r_:1259114608426487839>', chance: 300/1851},  
        { emoji: '<:SR:1259113778747015233>', chance: 250/1851},  
        { emoji: '<:UR:1259113669925539902>', chance: 200/1851 },
        { emoji: '<:LR:1259113497053233162>', chance: 100/1851 }
         
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
// Add this to helpers.js
const battleImageCache = new Map();

function getCachedBattleImage(userData, pokemonName, isShiny, level) {
    const cacheKey = `${userData.id}_${pokemonName}_${isShiny}_${level}`;
    return battleImageCache.get(cacheKey);
}

function setCachedBattleImage(userData, pokemonName, isShiny, level, image) {
    const cacheKey = `${userData.id}_${pokemonName}_${isShiny}_${level}`;
    battleImageCache.set(cacheKey, image);
}


function getRaidPokemonRarity() {
    const rarities = [
        { emoji: '<:n_:1259114941873520734>', chance: 0.341463 },  // 700/2050
        { emoji: '<:U_:1259114756313452680>', chance: 0.243902 },  // 500/2050
        { emoji: '<:r_:1259114608426487839>', chance: 0.146341 },  // 300/2050
        { emoji: '<:SR:1259113778747015233>', chance: 0.121951 },  // 250/2050
        { emoji: '<:UR:1259113669925539902>', chance: 0.097561 },  // 200/2050
        { emoji: '<:LR:1259113497053233162>', chance: 0.048780 }   // 100/2050
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
            { name: 'bulbasaur',rarity:'<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
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
        pokeball: 0.40,
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
    getActivePokemon,
    getRaidPokemonRarity,
    getCachedBattleImage,
    setCachedBattleImage,
    useRareCandy,
    getCustomRarity,
    getUserFilePath
};