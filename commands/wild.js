const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, generateWildPokemon, updateUserData, getActivePokemon, saveEssentialUserData,checkRegionTaskProgress } = require('../utils/helpers.js');
const { v4: uuidv4 } = require('uuid');

// Macro detection configuration
const MACRO_DETECTION = {
    MAX_CLICKS: 3, // Maximum allowed clicks
    TIME_WINDOW: 1000, // 1 second time window
    BAN_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Temporary storage for macro tracking
const macroTracker = new Map();

const COOLDOWN_TIME = 10000; // 10 seconds in milliseconds
const FIGHT_BUTTON_COOLDOWN = 3000; // 3 seconds cooldown for fight button

const baseRarities = [
  { emoji: '<:n_:1259114941873520734>', chance: 700/1851 },
  { emoji: '<:U_:1259114756313452680>', chance: 500/1851 },
  { emoji: '<:r_:1259114608426487839>', chance: 300/1851},
  { emoji: '<:SR:1259113778747015233>', chance: 250/1851},
  { emoji: '<:UR:1259113669925539902>', chance: 200/1851 },
  { emoji: '<:LR:1259113497053233162>', chance: 100/1851 }
];

function getcustomrarity(baseRarities, customChance) {
  let customRarities = JSON.parse(JSON.stringify(baseRarities));
  let highRarityChance = customRarities.slice(3).reduce((sum, rarity) => sum + rarity.chance, 0);
  let boostFactor = 1 + (customChance * 0.5);
  
  for (let i = 3; i < customRarities.length; i++) {
    customRarities[i].chance *= boostFactor;
  }
  
  let newTotalChance = customRarities.reduce((sum, rarity) => sum + rarity.chance, 0);
  
  customRarities.forEach(rarity => {
    rarity.chance /= newTotalChance;
  });
  
  return customRarities;
}

// Function to check and update macro tracking
function checkMacroAbuse(userId) {
    const now = Date.now();
    
    // Check if user is currently banned
    if (macroTracker.has(userId) && macroTracker.get(userId).bannedUntil > now) {
        const remainingTime = Math.ceil((macroTracker.get(userId).bannedUntil - now) / 1000);
        return {
            isBanned: true,
            remainingTime
        };
    }

    // Initialize or get user's click tracking
    if (!macroTracker.has(userId)) {
        macroTracker.set(userId, {
            clicks: [],
            bannedUntil: 0
        });
    }

    const userTracker = macroTracker.get(userId);

    // Remove old clicks
    userTracker.clicks = userTracker.clicks.filter(time => now - time < MACRO_DETECTION.TIME_WINDOW);

    // Add current click
    userTracker.clicks.push(now);

    // Check for macro abuse
    if (userTracker.clicks.length > MACRO_DETECTION.MAX_CLICKS) {
        // Ban the user
        userTracker.bannedUntil = now + MACRO_DETECTION.BAN_DURATION;
        return {
            isBanned: true,
            remainingTime: MACRO_DETECTION.BAN_DURATION / 1000
        };
    }

    return { isBanned: false };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wild')
        .setDescription('Encounter a wild Pokémon!'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const userName = interaction.user.username || 'Trainer';

        // Check for macro abuse
        const macroCheck = checkMacroAbuse(userId);
        if (macroCheck.isBanned) {
            return interaction.reply({
                content: `You've been temporarily banned from the wild encounter for macro abuse. Please wait ${Math.ceil(macroCheck.remainingTime)} seconds.`,
                ephemeral: true
            });
        }

        try {
            let userData = await getUserData(userId);
            if (!userData) {
                return interaction.reply('You need to start your journey first! Use the `/start` command.');
            }

            // Check cooldown
            const now = Date.now();
            if (userData.lastWildEncounter && now - userData.lastWildEncounter < COOLDOWN_TIME) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - userData.lastWildEncounter)) / 1000);
                return interaction.reply(`You need to wait ${remainingTime} more seconds before encountering another wild Pokémon!`);
            }

            // Apply custom rarity if set
            let rarities = baseRarities;
            if (userData.customChances && userData.customChances.rarity) {
                rarities = getcustomrarity(baseRarities, userData.customChances.rarity);
            }

            const userLevel = Math.max(...userData.pokemon.map(p => p.level));
            const wildPokemon = generateWildPokemon(userLevel, rarities);
            const encounterId = uuidv4();

            console.log(`User ${userName} encountered a wild ${wildPokemon.name} (Level ${wildPokemon.level})`);
            const progressMessage = await checkRegionTaskProgress(userId);
            

            userData.currentWildPokemon = { ...wildPokemon, defeated: false, encounterId };
            userData.lastWildEncounter = now; // Update last encounter time
            await updateUserData(userId, userData);
            await saveEssentialUserData(userId, userData);

            const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
            const encounterEmbed = createEncounterEmbed(wildPokemon, userName, avatarUrl);
            
            // Randomly determine fight button position
            const actionRow = createActionRowWithRandomButtons();

            const response = await interaction.reply({embeds: [encounterEmbed], components: [actionRow], fetchReply: true });

            const collector = response.createMessageComponentCollector({ 
                filter: i => i.user.id === userId && 
                             (i.customId === 'fight' || 
                              i.customId === 'dummy1' || 
                              i.customId === 'dummy2'),
                time: 30000 // 30 seconds
            });

            // Track the first valid interaction to prevent multiple clicks
            let firstInteractionTime = null;
            let fightButtonClicked = false;

            collector.on('collect', async i => {
                if (i.user.id !== userId) {
                    return i.reply({ content: "This isn't your encounter!", ephemeral: true });
                }

                // Check for macro abuse on each interaction
                const macroCheck = checkMacroAbuse(userId);
                if (macroCheck.isBanned) {
                    return i.reply({
                        content: `You've been temporarily banned from the wild encounter for macro abuse. Please wait ${Math.ceil(macroCheck.remainingTime)} seconds.`,
                        ephemeral: true
                    });
                }

                // Prevent multiple interactions within a short time
                if (firstInteractionTime && (now - firstInteractionTime < FIGHT_BUTTON_COOLDOWN)) {
                    return i.reply({ content: "Please wait a moment before interacting again.", ephemeral: true });
                }

                // Only process the first interaction
                if (!firstInteractionTime) {
                    firstInteractionTime = Date.now();
                }

                // Only proceed if fight button is clicked
                if (i.customId === 'fight' && !fightButtonClicked) {
                    fightButtonClicked = true;
                    await i.deferUpdate();
                    const fightCommand = require('./fight.js');
                    const fightResult = await fightCommand.execute(i, response, userData.currentWildPokemon.encounterId);
                    
                    // After the fight, check for level up if the user won
                    if (fightResult && fightResult.userWon) {
                        await checkForLevelUp(userId, interaction);
                    }
                } else if (i.customId !== 'fight') {
                    // Dummy buttons do nothing
                    await i.deferUpdate();
                }
                await interaction.followUp(progressMessage);
            });

            collector.on('end', async (collected, reason) => {
                const disabledActionRow = actionRow.components.map(button => ButtonBuilder.from(button).setDisabled(true));
                await response.edit({ components: [new ActionRowBuilder().addComponents(disabledActionRow)] });
            });

        } catch (error) {
            console.error(`Error in wild command for user ${userId}: ${error.message}`);
            await interaction.reply('There was an error during the wild encounter. Please try again.');
        }
    },
};

function createEncounterEmbed(pokemon, userName, avatarUrl) {
    let imgUrl = 'https://play.pokemonshowdown.com/sprites/ani/';
    if (pokemon.isShiny) {
        imgUrl = 'https://play.pokemonshowdown.com/sprites/ani-shiny/';
    }

    const shinyEmoji = pokemon.isShiny ? '✨ ' : '';
    return new EmbedBuilder()
        .setColor('#0c0c0c')
        .setAuthor({ 
            name: userName || 'Trainer',
            iconURL: avatarUrl
        })
        .setTitle(`A wild ${pokemon.name} ${shinyEmoji} appeared!`)
        .setDescription(`Level ${pokemon.level}${pokemon.isShiny ? ' (Shiny!)' : ''}`)
        .setImage(`${imgUrl}${pokemon.name.toLowerCase()}.gif`)
        .setFooter({ text: 'Click the correct button to battle!' });
}

function createActionRowWithRandomButtons() {
    // Create an array of button positions
    const positions = [0, 1, 2];
    const fightPosition = Math.floor(Math.random() * 3);

    // Create buttons
    const buttons = positions.map(pos => {
        if (pos === fightPosition) {
            return new ButtonBuilder()
                .setCustomId('fight')
                .setLabel('Fight')
                .setStyle(ButtonStyle.Primary);
        } else {
            // Dummy buttons
            return new ButtonBuilder()
                .setCustomId(pos === 1 ? 'dummy1' : 'dummy2')
                .setLabel('???')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false);
        }
    });

    // Shuffle the buttons to randomize their order
    for (let i = buttons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [buttons[i], buttons[j]] = [buttons[j], buttons[i]];
    }

    return new ActionRowBuilder().addComponents(buttons);
}

async function checkForLevelUp(userId, interaction) {
    try {
        const userData = await getUserData(userId);
        const activePokemon = await getActivePokemon(userData);

        if (!activePokemon) {
            return;
        }

        const chanceToLevelUp = Math.random();
        if (chanceToLevelUp < 0.1) { // 10% chance to level up, adjust as needed
            activePokemon.level += 1;
            await updateUserData(userId, userData);
            await interaction.followUp(`Congratulations! Your ${activePokemon.name} leveled up to level ${activePokemon.level}!`);
            console.log(`${interaction.user.username}'s ${activePokemon.name} leveled up to ${activePokemon.level}`);
        }
    } catch (error) {
        console.error(`Error in checkForLevelUp for user ${userId}: ${error.message}`);
    }
}