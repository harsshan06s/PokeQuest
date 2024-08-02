import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';

async function getAllPokemon() {
    console.log("Fetching total Pokémon count...");
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
    const data = await response.json();
    const totalCount = data.count;
    console.log(`Total number of Pokémon: ${totalCount}`);

    console.log("Fetching list of all Pokémon...");
    const allPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${totalCount}`);
    const allPokemonData = await allPokemonResponse.json();
    return allPokemonData.results;
}

async function getPokemonTypes(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const pokemonData = await response.json();
        return pokemonData.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`Timeout fetching data for ${url}`);
            return ['Unknown'];
        }
        throw error;
    }
}

async function createPokemonTypeDict() {
    const pokemonList = await getAllPokemon();
    const pokemonTypes = {};
    let count = 0;

    for (const pokemon of pokemonList) {
        try {
            const name = pokemon.name.split('-')[0];
            const types = await getPokemonTypes(pokemon.url);
            pokemonTypes[name] = types;
            count++;
            if (count % 50 === 0) console.log(`Processed ${count}/${pokemonList.length} Pokémon`);
        } catch (error) {
            console.error(`Error processing ${pokemon.name}: ${error.message}`);
        }
    }

    return pokemonTypes;
}

async function saveToJson(data, filename) {
    await writeFile(filename, JSON.stringify(data, null, 2));
}

async function main() {
    try {
        console.log("Starting Pokémon data collection...");
        const pokemonTypes = await createPokemonTypeDict();
        await saveToJson(pokemonTypes, 'pokemon_types.json');
        console.log("Pokémon types have been saved to pokemon_types.json");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();