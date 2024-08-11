const fs = require('fs').promises;
const { clear } = require('console');
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage,registerFont } = require('canvas');
registerFont(path.join(__dirname, '..', 'fonts', 'DisposableDroid BB.ttf'), { family: 'DisposableDroid BB' });




const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const POKEMON_LIST_PATH = path.join(__dirname, '..', 'data', 'pokemon-list.json');
const POKEMON_TYPES_PATH = path.join(__dirname, '..', 'data', 'pokemon_types.json');

let pokemonList = [];
let pokemonList1 = {};

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
        
        // Load a fallback image
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
    ctx.fillText(userPokemonName, width - 250, height - 95);
    ctx.font = '15px DisposableDroidBB'; // Smaller font for level
    ctx.fillText(`Lv${userPokemonLevel.toString().padStart(2, '')}`, width - 120, height - 95);

    // Return the canvas buffer
    return canvas.toBuffer();
}


async function getActivePokemon(userData) {
    const activePokemon = userData.activePokemon || userData.pokemon[userData.selectedPokemon];
    if (activePokemon && (!activePokemon.types || activePokemon.types.length === 0)) {
        activePokemon.types = pokemonList1[activePokemon.name.toLowerCase()] || ['Unknown'];
    }
    return activePokemon;
}

async function writeUserData(data) {
    await fs.writeFile(USER_DATA_PATH, JSON.stringify(data, null, 2));
}

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
async function getUserData(userId) {
    const userData = await readUserData();
    if (userData[userId] && !userData[userId].lastWildEncounter) {
        userData[userId].lastWildEncounter = 0; // Initialize to 0 if not present
        await writeUserData(userData);
    }
    return userData[userId];
}

async function createOrUpdateUser(userId, region, selectedStarter) {
    const userData = await readUserData();

    if (userData[userId]) {
        // Update existing user
        userData[userId] = {
            ...userData[userId],
            region: region,
            pokemon: [selectedStarter],
            lastRestart: new Date().toISOString()
        };
    } else {
        // Create new user
        userData[userId] = {
            id: userId,
            region: region,
            pokemon: [selectedStarter],
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

    await writeUserData(userData);
    return userData[userId];
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

    // If updating Pokemon, ensure type information is included
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
    await saveEssentialUserData(userId, userData[userId]);
    return userData[userId];
}


async function saveEssentialUserData(userId, userData) {
    const essentialData = {
        id: userId,
        selectedPokemon: userData.selectedPokemon,
        activePokemon: userData.pokemon[userData.selectedPokemon],
        money: userData.money,
        items: userData.items,
        lastWildEncounter: userData.lastWildEncounter
    };

    const filePath = path.join(__dirname, '..', 'data', `${userId}_essential.json`);
    await fs.writeFile(filePath, JSON.stringify(essentialData, null, 2));
}


function generateWildPokemon(userLevel, userData = {}) {
    if (pokemonList.length === 0) {
        console.error('Pokemon list is empty. Make sure loadPokemonLists() is called before generating wild Pokemon.');
        return null;
    }
    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const level = Math.min(85, Math.max(1, Math.floor(userLevel + (Math.random() * 10 - 5))));
    const pokemonTypes = pokemonList1[randomPokemon.toLowerCase()] || ['Unknown'];

    return {
        name: randomPokemon.charAt(0).toUpperCase() + randomPokemon.slice(1),
        type: pokemonTypes[0], // Use the first type
        level,
        exp: 0,
        isShiny: isShiny(userData),
        moves: ['Tackle'], // You might want to generate moves based on the Pokemon and its level
        catchRate: 100, // You might want to set this based on the specific Pokemon
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
    saveEssentialUserData,
    createRaidBattleImage,
    loadPokemonLists,
    getStarterPokemon
};