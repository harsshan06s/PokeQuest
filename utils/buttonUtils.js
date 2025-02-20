const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Define item IDs for each Pokeball type
const ITEM_IDS = {
    POKEBALL: 1,
    GREATBALL: 2,
    ULTRABALL: 3,
    MASTERBALL: 4
};

function createPokeBallButtons(userData, encounterId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`catch_${ITEM_IDS.POKEBALL}_${encounterId}`)
                .setLabel(`Pokeball`)
                .setEmoji('1259115461770084457')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items[ITEM_IDS.POKEBALL] || userData.items[ITEM_IDS.POKEBALL] <= 0),

            new ButtonBuilder()
                .setCustomId(`catch_${ITEM_IDS.GREATBALL}_${encounterId}`)
                .setLabel(`Greatball`)
                .setEmoji('1259115641080643657')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items[ITEM_IDS.GREATBALL] || userData.items[ITEM_IDS.GREATBALL] <= 0),

            new ButtonBuilder()
                .setCustomId(`catch_${ITEM_IDS.ULTRABALL}_${encounterId}`)
                .setLabel(`Ultraball`)
                .setEmoji('1259115187990958090')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items[ITEM_IDS.ULTRABALL] || userData.items[ITEM_IDS.ULTRABALL] <= 0),

            new ButtonBuilder()
                .setCustomId(`catch_${ITEM_IDS.MASTERBALL}_${encounterId}`)
                .setLabel(`Masterball`)
                .setEmoji('1259115795317784627')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items[ITEM_IDS.MASTERBALL] || userData.items[ITEM_IDS.MASTERBALL] <= 0)
        );
}

module.exports = { createPokeBallButtons };
