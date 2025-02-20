const axios = require('axios');
const fs = require('fs').promises;

async function fetchPokemonList() {
    const url = 'https://pokeapi.co/api/v2/pokemon?limit=1008'; // Fetch all Pokémon
    try {
        const response = await axios.get(url);
        const pokemonData = response.data.results;

        // Extract Pokémon names and save as a JSON file
        const pokemonList = pokemonData.map((pokemon, index) => ({
            id: index + 1,
            name: pokemon.name
        }));

        await fs.writeFile('./pokemon-list.json', JSON.stringify(pokemonList, null, 2));
        console.log('Pokémon list saved to pokemon-list.json');
    } catch (error) {
        console.error('Error fetching Pokémon list:', error.message);
    }
}

fetchPokemonList();
