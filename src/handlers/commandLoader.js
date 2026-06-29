import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Routes } from 'discord.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Keeps your excellent recursive subfolder scanner intact
async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map(async (dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return files.flat();
}

/**
 * 1. Loads commands from files into bot memory (Expected by app.js)
 */
export async function loadCommands(client) {
  try {
    const commandsPath = join(__dirname, '../commands');
    const commandFiles = (await getFiles(commandsPath))
      .filter(file => file.endsWith('.js') && !file.includes('_') && !file.includes('\\_') && !file.includes('/_'));
    
    let loadedCount = 0;

    for (const file of commandFiles) {
      try {
        // Using file:// prefix ensures ESM imports work seamlessly across all OS environments
        const commandModule = await import(`file://${file}`);
        const command = commandModule.default;
        
        if (!command || !command.data || !command.execute) {
          logger.warn(`Command at ${file} is missing required "data" or "execute" property.`);
          continue;
        }
        
        client.commands.set(command.data.name, command);
        loadedCount++;
        logger.debug(`Loaded command: ${command.data.name}`);
      } catch (error) {
        logger.error(`Error loading command ${file}:`, error);
      }
    }
    
    logger.info(`Successfully loaded ${loadedCount} commands into local memory`);
  } catch (error) {
    logger.error('Error loading commands:', error);
  }
}

/**
 * 2. Pushes commands from bot memory up to Discord's API servers (Expected by app.js)
 */
export async function registerCommands(client, guildId) {
  try {
    const commandsJSON = Array.from(client.commands.values()).map(command => command.data.toJSON());

    if (guildId) {
      logger.info(`Syncing slash command layouts to Guild ID: ${guildId}...`);
      await client.rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commandsJSON }
      );
    } else {
      logger.info('Syncing slash command layouts globally to all guilds...');
      await client.rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commandsJSON }
      );
    }
    logger.info('✅ Slash commands successfully registered with Discord API!');
  } catch (error) {
    logger.error('❌ Failed to register slash commands with Discord API:', error);
  }
}
