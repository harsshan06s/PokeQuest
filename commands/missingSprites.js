const fs = require('fs').promises;
const path = require('path');

const MISSING_SPRITES_FILE = path.join(__dirname, '..', 'data', 'missing_sprites.json');

async function logMissingSprite(pokemonName, missingForms) {
    try {
        let missingSprites = {};
        try {
            const data = await fs.readFile(MISSING_SPRITES_FILE, 'utf8');
            missingSprites = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        if (!missingSprites[pokemonName]) {
            missingSprites[pokemonName] = [];
        }
        missingSprites[pokemonName] = [...new Set([...missingSprites[pokemonName], ...missingForms])];

        await fs.writeFile(MISSING_SPRITES_FILE, JSON.stringify(missingSprites, null, 2));
    } catch (error) {
        console.error('Error logging missing sprite:', error);
    }
}

async function getMissingSprites() {
    try {
        const data = await fs.readFile(MISSING_SPRITES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

module.exports = { logMissingSprite, getMissingSprites };