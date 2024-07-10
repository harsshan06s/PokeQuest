const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createPokeBallButtons(userData, encounterId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`catch_pokeball_${encounterId}`)
                .setLabel(`Pokeball (${userData.items.pokeball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items.pokeball || userData.items.pokeball <= 0),
            new ButtonBuilder()
                .setCustomId(`catch_greatball_${encounterId}`)
                .setLabel(`Greatball (${userData.items.greatball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items.greatball || userData.items.greatball <= 0),
            new ButtonBuilder()
                .setCustomId(`catch_ultraball_${encounterId}`)
                .setLabel(`Ultraball (${userData.items.ultraball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items.ultraball || userData.items.ultraball <= 0),
            new ButtonBuilder()
                .setCustomId(`catch_masterball_${encounterId}`)
                .setLabel(`Masterball (${userData.items.masterball || 0})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!userData.items.masterball || userData.items.masterball <= 0)
        );
}

module.exports = { createPokeBallButtons };