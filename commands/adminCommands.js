const fs = require('fs').promises;
const path = require('path');

const USER_DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');

async function clearAllUsersPokemonData() {
    try {
        // Read the current user data
        const data = await fs.readFile(USER_DATA_PATH, 'utf8');
        let userData = JSON.parse(data);

        // Iterate through all users and clear their Pokémon data
        for (let userId in userData) {
            userData[userId].pokemon = []; // Clear the Pokémon array
            userData[userId].caughtPokemon = {}; // Clear the caught Pokémon object
            // You might want to reset other related fields here
        }

        // Write the updated data back to the file
        await fs.writeFile(USER_DATA_PATH, JSON.stringify(userData, null, 2));

        console.log("All users' Pokémon data has been cleared successfully.");
        return true;
    } catch (error) {
        console.error("Error clearing users' Pokémon data:", error);
        return false;
    }
}

module.exports = {
    clearAllUsersPokemonData
};