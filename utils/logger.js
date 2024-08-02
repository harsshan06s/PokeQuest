// logger.js

const fs = require('fs').promises;
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, 'pokemon_game.log');

async function writeLog(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}]: ${message}\n`;
    
    try {
        await fs.appendFile(LOG_FILE_PATH, logMessage);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

function log(message) {
    writeLog('INFO', message);
}

function error(message) {
    writeLog('ERROR', message);
}

module.exports = { log, error };