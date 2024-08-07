const fs = require('fs').promises;
const { clear } = require('console');
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont(path.join(__dirname, '..', 'fonts', 'DisposableDroid BB.ttf'), { family: 'DisposableDroid BB' });

const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const POKEMON_LIST_PATH = path.join(__dirname, '..', 'data', 'pokemon-list.json');
const POKEMON_TYPES_PATH = path.join(__dirname, '..', 'data', 'pokemon_types.json');



let pokemonList = [];
let pokemonList1 = {};

function getUserFilePath(userId) {
    return path.join(__dirname, '..', 'data', 'users', `${userId}.json`);
}

async function loadPokemonLists() {
    try {
        // Load main Pokémon list
        const listData = await fs.readFile(POKEMON_LIST_PATH, 'utf8');
        pokemonList = JSON.parse(listData);
        console.log(`Main Pokémon list loaded successfully. Total Pokémon: ${pokemonList.length}`);

        // Load Pokémon types
        const typesData = await fs.readFile(POKEMON_TYPES_PATH, 'utf8');
        pokemonList1 = JSON.parse(typesData);
        console.log(`Pokémon types loaded successfully. Total Pokémon with types: ${Object.keys(pokemonList1).length}`);
    } catch (error) {
        console.error(`Error loading Pokémon lists: ${error}`);
        if (error instanceof SyntaxError) {
            console.error('JSON parsing error. Please check the format of your Pokémon data files.');
        }
    }
}

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
        userPokemon = await loadImage(path.join(__dirname, 'pokemon_images', 'default.png'));
    }

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
    ctx.font = '15px DisposableDroidBB';
    ctx.fillText(`${wildPokemonLevel.toString().padStart(3, '')}`, 250, 47);
   
    // User Pokemon (bottom right box)
    ctx.font = '20px DisposableDroidBB';
    ctx.fillText(userPokemonName, width - 250, height - 95);
    ctx.font = '15px DisposableDroidBB';
    ctx.fillText(`Lv${userPokemonLevel.toString().padStart(2, '')}`, width - 120, height - 95);

    return canvas.toBuffer();
}

async function getActivePokemon(userData) {
    const activePokemon = userData.activePokemon || userData.pokemon[userData.selectedPokemon];
   
    if (!activePokemon) {
        return null;
    }

    const pokemonName = activePokemon.name.toLowerCase();
    const pokemonType = pokemonList1[pokemonName] || ['Unknown'];

    return {
        ...activePokemon,
        type: pokemonType
    };
}

async function writeUserData(userId, data) {
    const userDir = path.join(__dirname, '..', 'data', 'users');
    const filePath = path.join(userDir, `${userId}.json`);
    
    try {
        await fs.mkdir(userDir, { recursive: true });
        
        // Create an empty file if it doesn't exist
        await fs.writeFile(filePath, '', { flag: 'wx' });
        
        // Write the data
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error writing user data for ${userId}:`, error);
            throw error;
        }
        // If the file already exists, just write the data
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
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
function generateWildPokemon(userLevel) {
    if (pokemonList.length === 0) {
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
        type: 'Unknown',
        level,
        exp: 0,
        isShiny: isShiny(),
        moves: ['Tackle'],
        catchRate: 100,
        rarity: getPokemonRarity()
    };
}

// Make sure to call this function when your application starts
loadPokemonLists();

function isShiny() {
    return Math.random() < 1 / 100;
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
        moves: ['Tackle']
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

    return rarities[0].emoji;
}

function getRaidPokemonRarity() {
    const rarities = [
        { emoji: '<:n_:1259114941873520734>', chance: 0.341463 },
        { emoji: '<:U_:1259114756313452680>', chance: 0.243902 },
        { emoji: '<:r_:1259114608426487839>', chance: 0.146341 },
        { emoji: '<:SR:1259113778747015233>', chance: 0.121951 },
        { emoji: '<:UR:1259113669925539902>', chance: 0.097561 },
        { emoji: '<:LR:1259113497053233162>', chance: 0.048780 }
    ];

    const random = Math.random();
    let cumulativeChance = 0;

    for (const rarity of rarities) {
        cumulativeChance += rarity.chance;
        if (random < cumulativeChance) {
            return rarity.emoji;
        }
    }

    return rarities[0].emoji;
}

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
    useRareCandy,
    loadPokemonLists
}; 