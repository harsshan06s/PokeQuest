const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont(path.join(__dirname, '..', 'fonts', 'DisposableDroid BB.ttf'), { family: 'DisposableDroid BB' });

const regions = {
    kanto: {
        name: "Kanto",
        requiredPokemon: 100, // Number of Pokémon to catch to unlock the next region
        nextRegion: "johto",  // The next region to unlock
        pokedexRange: [1, 151] // National Dex IDs for Kanto Pokémon
    },
    johto: {
        name: "Johto",
        requiredPokemon: 80,
        nextRegion: "hoenn",
        pokedexRange: [152, 251]
    },
    hoenn: {
        name: "Hoenn",
        requiredPokemon: 70,
        nextRegion: "sinnoh",
        pokedexRange: [252, 386]
    },
    sinnoh: {
        name: "Sinnoh",
        requiredPokemon: 60,
        nextRegion: "unova",
        pokedexRange: [387, 493]
    },
    unova: {
        name: "Unova",
        requiredPokemon: 50,
        nextRegion: "kalos",
        pokedexRange: [494, 649]
    },
    kalos: {
        name: "Kalos",
        requiredPokemon: 40,
        nextRegion: "alola",
        pokedexRange: [650, 721]
    },
    alola: {
        name: "Alola",
        requiredPokemon: 30,
        nextRegion: "galar",
        pokedexRange: [722, 809]
    },
    galar: {
        name: "Galar",
        requiredPokemon: 20,
        nextRegion: null, // Final region
        pokedexRange: [810, 898]
    }
};


const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const POKEMON_LIST_PATH = path.join(__dirname, '..', 'data', 'pokemon-list.json');
const POKEMON_TYPES_PATH = path.join(__dirname, '..', 'data', 'pokemon_types.json');
const POKEMON_LIST_PATH1 = path.join(__dirname, '../data/pokemon-list1.json');

async function loadPokemonLists1() {
    const data = await fs.readFile(POKEMON_LIST_PATH1, 'utf8');
    return JSON.parse(data);



}

// Evolution data file path
const POKEMON_EVOLUTIONS_PATH = path.join(__dirname, '..', 'data', 'pokemon-evolutions.json');
let evolutionData = {};


let pokemonList = [];
let pokemonList1 = {};

// Load evolution data
async function loadEvolutionData() {
    try {
        const data = await fs.readFile(POKEMON_EVOLUTIONS_PATH, 'utf8');
        evolutionData = JSON.parse(data);
        console.log('Evolution data loaded successfully.');
        return evolutionData;
    } catch (error) {
        console.error('Error loading evolution data:', error.message);
        return null;
    }
}


(async () => {
    evolutionData = await loadEvolutionData();
    if (!evolutionData) {
        console.error("Failed to load evolution data.");
    }
})();


  

 
// Load Pokémon Lists
async function loadPokemonLists() {
    try {
        const listData = await fs.readFile(POKEMON_LIST_PATH, 'utf8');
        pokemonList = JSON.parse(listData);
        const typesData = await fs.readFile(POKEMON_TYPES_PATH, 'utf8');
        pokemonList1 = JSON.parse(typesData);
        const list1data=await fs.readFile(POKEMON_LIST_PATH1, 'utf8');
        pokemonList2=JSON.parse(list1data);
    } catch (error) {
        console.error(`Error loading Pokémon lists: ${error}`);
    }
}

// Assign a random growth type to a Pokémon
// Function to assign a random growth type
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

// Experience functions for each growth type
function fastExperience(level) {
    return Math.floor(4 * Math.pow(level, 3) / 5);
}

function mediumFastExperience(level) {
    return Math.pow(level, 3);
}

function slowExperience(level) {
    return Math.floor(5 * Math.pow(level, 3) / 4);
}

function mediumSlowExperience(level) {
    return Math.floor((6 / 5) * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140);
}

function fluctuatingExperience(level) {
    if (level <= 15) return Math.floor(Math.pow(level, 3) * ((level + 1) / 3 + 24) / 50);
    if (level <= 36) return Math.floor(Math.pow(level, 3) * (level + 14) / 50);
    return Math.floor(Math.pow(level, 3) * (level / 2 + 32) / 50);
}

function erraticExperience(level) {
    if (level <= 50) return Math.floor(Math.pow(level, 3) * (10 * level + 37) / 50);
    if (level <= 68) return Math.floor(Math.pow(level, 3) * (10 * level + 70) / 50);
    if (level <= 98) return Math.floor(Math.pow(level, 3) * (10 * level + 100) / 50);
    return Math.floor(Math.pow(level, 3) * (10 * level + 120) / 50);
}



async function loadImageFromUrl(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return loadImage(response.data);
}

// Generate wild Pokémon based on user region and randomized growth type
function generateWildPokemon(userLevel, userData = {}) {
    if (pokemonList2.length === 0) {
        console.error('Pokemon list is empty.');
        return null;
    }

    // Determine the current region
    const currentRegion = userData.region || "kanto";
    const regionConfig = regions[currentRegion];

    if (!regionConfig) {
        console.error('Invalid region configuration.');
        return null;
    }

    // Filter Pokémon by the region's Pokédex range
    const regionPokemon = pokemonList2.filter(pokemon => {
        return pokemon.id >= regionConfig.pokedexRange[0] && pokemon.id <= regionConfig.pokedexRange[1];
    });

    if (regionPokemon.length === 0) {
        console.error(`No Pokémon available for region: ${currentRegion}`);
        return null;
    }

    // Select a random Pokémon from the filtered list
    const randomPokemon = regionPokemon[Math.floor(Math.random() * regionPokemon.length)];

    // Generate Pokémon details
    const level = Math.floor(Math.random() * userLevel) + 1; // Random level up to user level
    const pokemonTypes = pokemonList2[randomPokemon.name.toLowerCase()] || ['Unknown'];

    return {
        name: randomPokemon.name.charAt(0).toUpperCase() + randomPokemon.name.slice(1),
        types: pokemonTypes,
        level,
        exp: 0, // Initial EXP for wild Pokémon
        isShiny: isShiny(userData),
        moves: ['Tackle'], // Default move; can be expanded
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
// In your helpers.js file
async function createOrUpdateUser(userId, region, selectedStarter, restart = false) {
    const userData = await readUserData();

    if (restart) {
        // Restart user data
        delete userData[userId];
        await writeUserData(userData);
        return await createOrUpdateUser(userId, region, selectedStarter);
    } else {
        const existingUser = userData[userId];

        if (existingUser) {
            // Update region or add a new Pokémon if the user exists
            existingUser.region = region || existingUser.region;
            existingUser.pokemon.push({
                name: selectedStarter.name,
                rarity: selectedStarter.rarity,
                exp: 0,
                growthType: assignGrowthType(),
                level: selectedStarter.level || 1,
                types: selectedStarter.type ? [selectedStarter.type] : [],
                moves: selectedStarter.moves || []
            });
            existingUser.lastRestart = new Date().toISOString();
        } else {
            // Initialize a new user
            userData[userId] = {
                id: userId,
                region: region || "kanto", // Start in Kanto by default
                progress: { caughtPokemon: 0 }, // Track progress for the current task
                pokemon: [{
                    name: selectedStarter.name,
                    rarity: selectedStarter.rarity,
                    exp: 0,
                    growthType: assignGrowthType(),
                    level: selectedStarter.level || 1,
                    types: selectedStarter.type ? [selectedStarter.type] : [],
                    moves: selectedStarter.moves || []
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

    // If updating Pokemon, ensure type information is included and names are strings
    if (updateData.pokemon) {
        updateData.pokemon = updateData.pokemon.map(pokemon => {
            // Ensure pokemon.name is a string
            if (typeof pokemon.name !== 'string') {
                console.warn(`Invalid pokemon name for user ${userId}:`, pokemon.name);
                pokemon.name = String(pokemon.name || '')
            }

            // Assign types if not present
            if (!pokemon.types || pokemon.types.length === 0) {
                pokemon.types = pokemonList1[pokemon.name.toLowerCase()] || ['Unknown'];
            }
            return pokemon;
        });
    }

    userData[userId] = { ...userData[userId], ...updateData };
    await writeUserData(userData);
    await saveEssentialUserData(userId, userData[userId]);
    return userData[userId];
}

// Get active Pokémon with type information
// helpers.js

// Function to get the active (selected) Pokémon from userData
async function getActivePokemon(userData) {
    // Use activePokemon if set, otherwise use the Pokémon at selectedPokemon index
    const activePokemon = userData.activePokemon || userData.pokemon[userData.selectedPokemon];
    
    // Ensure the active Pokémon has types; if not, assign types from pokemonList1 or use 'Unknown'
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

    if (userData.items[5] < quantity) {
        throw new Error('Not enough Rare Candy');
    }
    

    const pokemon = userData.pokemon[pokemonIndex];
    const oldLevel = pokemon.level;
    pokemon.level = Math.min(100, pokemon.level + quantity);
    userData.items[5] -= quantity;


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
function getRandomStarterPokemon(region) {
    const starters = {
        kanto: [
            { name: 'Bulbasaur', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Charmander', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Squirtle', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        johto: [
            { name: 'Chikorita', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Cyndaquil', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Leer'], catchRate: 45 },
            { name: 'Totodile', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Scratch', 'Leer'], catchRate: 45 }
        ],
        hoenn: [
            { name: 'Treecko', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Pound', 'Leer'], catchRate: 45 },
            { name: 'Torchic', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Mudkip', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 }
        ],
        sinnoh: [
            { name: 'Turtwig', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Withdraw'], catchRate: 45 },
            { name: 'Chimchar', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Leer'], catchRate: 45 },
            { name: 'Piplup', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ],
        unova: [
            { name: 'Snivy', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Leer'], catchRate: 45 },
            { name: 'Tepig', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 },
            { name: 'Oshawott', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        kalos: [
            { name: 'Chespin', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Fennekin', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Tail Whip'], catchRate: 45 },
            { name: 'Froakie', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ],
        alola: [
            { name: 'Rowlet', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Litten', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Popplio', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ],
        galar: [
            { name: 'Grookey', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Scorbunny', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Sobble', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ]
    };


    const regionStarters = starters[region.toLowerCase()] || starters.kanto;
    return regionStarters[Math.floor(Math.random() * regionStarters.length)]


}
function getStarterPokemon(region, starterName) {
    const starters = {
        kanto: [
            { name: 'Bulbasaur', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Charmander', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Squirtle', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        johto: [
            { name: 'Chikorita', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Cyndaquil', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Leer'], catchRate: 45 },
            { name: 'Totodile', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Scratch', 'Leer'], catchRate: 45 }
        ],
        hoenn: [
            { name: 'Treecko', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Pound', 'Leer'], catchRate: 45 },
            { name: 'Torchic', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Mudkip', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 }
        ],
        sinnoh: [
            { name: 'Turtwig', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Withdraw'], catchRate: 45 },
            { name: 'Chimchar', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Leer'], catchRate: 45 },
            { name: 'Piplup', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ],
        unova: [
            { name: 'Snivy', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Leer'], catchRate: 45 },
            { name: 'Tepig', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 },
            { name: 'Oshawott', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Tackle', 'Tail Whip'], catchRate: 45 }
        ],
        kalos: [
            { name: 'Chespin', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Fennekin', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Tail Whip'], catchRate: 45 },
            { name: 'Froakie', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ],
        alola: [
            { name: 'Rowlet', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Litten', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Popplio', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ],
        galar: [
            { name: 'Grookey', rarity: '<:SR:1259113778747015233>', type: 'Grass', level: 5, exp: 0, moves: ['Scratch', 'Growl'], catchRate: 45 },
            { name: 'Scorbunny', rarity: '<:SR:1259113778747015233>', type: 'Fire', level: 5, exp: 0, moves: ['Tackle', 'Growl'], catchRate: 45 },
            { name: 'Sobble', rarity: '<:SR:1259113778747015233>', type: 'Water', level: 5, exp: 0, moves: ['Pound', 'Growl'], catchRate: 45 }
        ]
    };
    if (!starters[region]) {
        throw new Error(`Invalid region: ${region}`);
    }

    const regionStarters = starters[region];
    if (!regionStarters || regionStarters.length === 0) {
        throw new Error(`No starter Pokémon defined for region: ${region}`);
    }

    return regionStarters;
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
async function deleteUserData(userId) {
    try {
        // Step 1: Read and update users.json
        const usersData = await fs.readFile(USER_DATA_PATH, 'utf8');
        const users = JSON.parse(usersData);

        if (users[userId]) {
            delete users[userId];  // Remove the user entry from users.json

            // Write the updated users data back to users.json
            await fs.writeFile(USER_DATA_PATH, JSON.stringify(users, null, 2));
            console.log(`Deleted user data for ${userId} from users.json.`);
        } else {
            console.log(`User ID ${userId} not found in users.json.`);
        }

        // Step 2: Delete the specific user's essential data file
        const userEssentialFilePath = path.join(__dirname, '..', 'data', `${userId}_essential.json`);
        try {
            await fs.unlink(userEssentialFilePath);  // Delete the essential file
            console.log(`Deleted ${userId}_essential.json.`);
        } catch (unlinkError) {
            console.error(`Error deleting ${userId}_essential.json:`, unlinkError);
        }

    } catch (error) {
        console.error(`Failed to delete data for user ${userId}:`, error);
        throw new Error('Could not delete user data');
    }
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
// helpers.js

// Gain experience and handle level up and evolution if eligible
async function gainExperience(userId, pokemonIndex, experience, opponentLevel) {
    const userData = await getUserData(userId);
    if (!userData) {
        throw new Error('User does not exist');
    }

    const pokemon = userData.pokemon[pokemonIndex];
    const growthType = pokemon.growthType || 'MediumFast'; // Default to MediumFast if growthType is not set
    const levelDifference = pokemon.level - opponentLevel;
    const scaledExperience = Math.max(1, experience * (1 - (levelDifference / 100))); // Ensure minimum gain

    // Apply experience to the Pokémon
    pokemon.exp += scaledExperience;

    let leveledUp = false;
    // Loop to handle multiple level-ups in case of high EXP gain
    while (pokemon.exp >= experienceToNextLevel(pokemon.level, growthType) && pokemon.level < 100) {
        pokemon.exp -= experienceToNextLevel(pokemon.level, growthType);
        pokemon.level += 1;
        leveledUp = true;
    }

    // Update the user data with the leveled Pokémon
    userData.pokemon[pokemonIndex] = pokemon;
    await updateUserData(userId, userData);

    if (leveledUp) {
        console.log(`${pokemon.name} leveled up! Now at level ${pokemon.level}.`);

        // Check for evolution if the Pokémon leveled up
        const evolutionMessage = await evolveSelectedPokemonIfEligible(userId);
        if (evolutionMessage) {
            console.log(evolutionMessage); // Log evolution message
        }
    }
}

// Calculate experience required for the next level


  async function countPokemonAcrossUsers(pokemonName) {
    const userData = await readUserData();
    let count = 0;
    
    for (const userId in userData) {
        const user = userData[userId];
        const userPokemon = user.pokemon || [];
        
        userPokemon.forEach(p => {
            // Check if p.name exists and is a string
            if (p.name && typeof p.name === 'string' && p.name.toLowerCase() === pokemonName.toLowerCase()) {
                count++;
            }
        });
    }
    
    return count;
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

// Check if selected Pokémon can evolve
const evolveSelectedPokemonIfEligible = async (userId, usedItem = null) => {
    const userData = await getUserData(userId);
    if (!userData || !userData.pokemon || userData.pokemon.length === 0) {
        return { success: false, message: "No Pokémon found for this user." };
    }

    const selectedPokemonIndex = userData.selectedPokemon;
    const pokemon = userData.pokemon[selectedPokemonIndex];

    if (!pokemon) {
        return { success: false, message: "No Pokémon selected for evolution." };
    }

    const pokemonName = pokemon.name.toLowerCase();
    const pokemonEvolutions = evolutionData[pokemonName];

    if (!pokemonEvolutions || pokemonEvolutions.length === 0) {
        return { success: false, message: `${capitalizeFirstLetter(pokemon.name)} cannot evolve.` };
    }

    for (const evo of pokemonEvolutions) {
        // Level-based evolution
        if (evo.triggerType === 'level-up' && pokemon.level >= evo.level) {
            const message = await applyEvolution(userId, pokemon, evo.evolvesTo, selectedPokemonIndex);
            return { success: true, message };
        }

        // Item-based evolution
        if (
            evo.triggerType === 'use-item' &&
            usedItem &&
            evo.item.toLowerCase() === usedItem.toLowerCase()
        ) {
            const message = await applyEvolution(userId, pokemon, evo.evolvesTo, selectedPokemonIndex);
            return { success: true, message };
        }
    }

    return { success: false, message: `No valid evolution conditions met for ${capitalizeFirstLetter(pokemon.name)}.` };
};


const applyEvolution = async (userId, pokemon, evolvedName, pokemonIndex) => {
    try {
        const previousName = pokemon.name;
        pokemon.name = capitalizeFirstLetter(evolvedName);

        // Update sprite URL
        const imgUrlBase = "https://play.pokemonshowdown.com/sprites/ani";
        pokemon.spriteUrl = pokemon.isShiny
            ? `${imgUrlBase}-shiny/${evolvedName.toLowerCase()}.gif`
            : `${imgUrlBase}/${evolvedName.toLowerCase()}.gif`;

        // Update the user's data for the selected Pokémon
        const userData = await getUserData(userId);
        userData.pokemon[pokemonIndex] = pokemon;
        await updateUserData(userId, userData);

        // Return success message
        return `${capitalizeFirstLetter(previousName)} evolved into ${pokemon.name}!`;
    } catch (error) {
        console.error("Error in applyEvolution:", error.message);
        throw new Error("Failed to apply evolution.");
    }
};

const useEvolutionItem = async (userId, itemIdentifier) => {
    try {
        const userData = await getUserData(userId);
        const activePokemon = await getActivePokemon(userData);

        if (!activePokemon) {
            console.error("No active Pokémon found for user:", userId);
            return { success: false, message: "You don't have an active Pokémon selected." };
        }
        
        // Debug logging
        console.log("Active Pokémon:", activePokemon.name);
        console.log("Item Identifier:", itemIdentifier);
        
        const pokemonName = activePokemon.name?.toLowerCase();

        if (!pokemonName) {
            return { success: false, message: "Active Pokémon has no valid name." };
        }

        const pokemonEvolutions = evolutionData[pokemonName];

        // Debug logging for evolutions
        console.log("Pokemon Evolutions:", JSON.stringify(pokemonEvolutions, null, 2));

        if (!pokemonEvolutions || pokemonEvolutions.length === 0) {
            console.error("No evolution data found for Pokémon:", pokemonName);
            return { success: false, message: `${capitalizeFirstLetter(activePokemon.name)} cannot evolve.` };
        }

        // Find valid evolution triggered by the specific item
        const validEvolution = pokemonEvolutions.find(
            evo => evo.triggerType === 'use-item' && 
                   evo.item.toLowerCase().replace(/\s+/g, '-') === itemIdentifier.toLowerCase().replace(/\s+/g, '-')
        );

        // Debug logging for valid evolution
        console.log("Valid Evolution:", validEvolution);

        if (!validEvolution) {
            return {
                success: false,
                message: `${capitalizeFirstLetter(activePokemon.name)} cannot evolve with ${capitalizeFirstLetter(itemIdentifier)}.`,
            };
        }

        // Perform evolution
        const message = await applyEvolution(
            userId,
            activePokemon,
            validEvolution.evolvesTo,
            userData.selectedPokemon
        );

        return { success: true, message, itemUsed: itemIdentifier };
    } catch (error) {
        console.error("Error in useEvolutionItem:", error.message);
        return { success: false, message: "An error occurred while trying to evolve the Pokémon." };
    }
};


// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function checkRegionTaskProgress(userId) {
    const userData = await getUserData(userId);
    const currentRegion = userData.region || "kanto";
    const regionConfig = regions[currentRegion];

    if (!regionConfig) {
        throw new Error("Invalid region configuration.");
    }

    // Count caught Pokémon progress
    const caughtPokemonCount = Object.keys(userData.caughtPokemon || {}).length;

    // Check if the task is completed
    if (caughtPokemonCount >= regionConfig.requiredPokemon) {
        const nextRegion = regionConfig.nextRegion;

        if (nextRegion) {
            userData.region = nextRegion;
            userData.progress.caughtPokemon = 0; // Reset progress for the new region
            await updateUserData(userId, userData);
            return `🎉 You have unlocked the **${regions[nextRegion].name}** region! 🎉`;
        } else {
            return "You have completed all available regions! Congratulations!";
        }
    }

    return `You need to catch ${regionConfig.requiredPokemon - caughtPokemonCount} more Pokémon to unlock the next region.`;
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
    updateUserData,
    saveEssentialUserData,
    getActivePokemon,
    calculateExperience,
    getRandomStarterPokemon,
    readUserData,
    writeUserData,
    deleteUserData,
    countPokemonAcrossUsers,
    loadEvolutionData,
    evolveSelectedPokemonIfEligible,
    applyEvolution,
    capitalizeFirstLetter,
    useEvolutionItem,
    loadPokemonLists1,
    checkRegionTaskProgress
};
