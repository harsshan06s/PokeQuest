const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { TOKEN, CLIENT_ID, GUILD_ID } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    console.log(`Loading command file: ${file}`);
    try {
        const command = require(`./commands/${file}`);
        console.log('Loaded command:', command);
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
        } else {
            console.error(`Invalid command file structure: ${file}`);
        }
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: client.commands.map(command => command.data.toJSON()),
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Load systems
const leveling = require('./systems/leveling.js');
const battle = require('./systems/battle.js');
const trade = require('./systems/trade.js');
const shop = require('./systems/shop.js');
const daily = require('./systems/daily-reward.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
  // You can add any message-based logic here if needed
  // For example, detecting messages from other bots
});

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});


client.login(TOKEN);
