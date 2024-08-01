const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { logMissingSprite } = require('./missingSprites.js');

const POKEMON_IMAGES_PATH = path.join(__dirname, '..', 'pokemon_images');
const DELAY_BETWEEN_POKEMON = 1000; // 2 seconds delay between each Pokémon

module.exports = {
    data: new SlashCommandBuilder()
        .setName('printpokedex')
        .setDescription('Print all Pokémon names and available sprites in the channel'),

    async execute(interaction) {
        await interaction.reply('Starting to print all Pokémon. This may take a while...');

        try {
            const pokemonImages = await fs.readdir(POKEMON_IMAGES_PATH);
            const pokemonSet = new Set(pokemonImages
                .filter(file => file.endsWith('.png'))
                .map(file => file.replace(/-shiny|-mega|-mega-shiny|\.png/g, ''))
            );

            const pokemonList = Array.from(pokemonSet).sort((a, b) => 
                a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
            );

            for (const [index, pokemon] of pokemonList.entries()) {
                const forms = ['', '-shiny', '-mega', '-mega-shiny'];
                let content = `**#${index + 1} ${pokemon}**\n`;
                let files = [];
                let missingForms = [];

                for (const form of forms) {
                    const fileName = `${pokemon}${form}.png`;
                    const imagePath = path.join(POKEMON_IMAGES_PATH, fileName);

                    if (pokemonImages.includes(fileName)) {
                        files.push(imagePath);
                        content += `${form ? form.slice(1).charAt(0).toUpperCase() + form.slice(2) : 'Normal'} sprite found\n`;
                    } else {
                        content += `${form ? form.slice(1).charAt(0).toUpperCase() + form.slice(2) : 'Normal'} sprite not found\n`;
                        missingForms.push(form ? form.slice(1) : 'normal');
                    }
                }

                if (missingForms.length > 0) {
                    await logMissingSprite(pokemon, missingForms);
                }

                if (files.length > 0) {
                    await interaction.channel.send({
                        content: content,
                        files: files
                    });
                } else {
                    await interaction.channel.send(content + "No sprites found for this Pokémon.");
                }

                // Add a delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_POKEMON));
            }

            await interaction.channel.send('Finished printing all Pokémon!');
        } catch (error) {
            console.error('Error printing Pokédex:', error);
            await interaction.channel.send('An error occurred while printing the Pokédex.');
        }
    },
};