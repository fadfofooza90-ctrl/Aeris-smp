import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Routes } from 'discord.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Recursive scanner to dig deep into subfolders
async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map(async (dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return files.flat();
}

/**
 * 1. Loads commands from your files into bot memory
 */
export async function loadCommands(client) {
  try {
    const commandsPath = join(__dirname, '../commands');
    
    // Verify the folder actually exists where the bot expects it
    try {
      await readdir(commandsPath);
    } catch {
      logger.error(`❌ Directory missing! Make sure your 'commands' folder lives inside 'src/': ${commandsPath}`);
      return;
    }
    
    const commandFiles = (await getFiles(commandsPath))
      .filter(file => file.endsWith('.js') && !file.includes('_') && !file.includes('\\_') && !file.includes('/_'));
    
    let loadedCount = 0;

    for (const file of commandFiles) {
      try {
        // Safe, cross-platform way to convert absolute system paths to clean web URLs
        const fileUrl = pathToFileURL(file).href;
        const commandModule = await import(fileUrl);
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
    
    logger.info(`Successfully loaded ${loadedCount} commands into local memory.`);
  } catch (error) {
    logger.error('Error loading commands:', error);
  }
}

/**
 * 2. Pushes those commands to Discord's server network
 */
export async function registerCommands(client, guildId) {
  try {
    const commandsJSON = Array.from(client.commands.values()).map(command => command.data.toJSON());

    if (guildId) {
      logger.info(`Syncing slash command layouts directly to Guild ID: ${guildId}...`);
      await client.rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commandsJSON }
      );
      logger.info('✅ Slash commands successfully registered to your development server!');
    } else {
      logger.info('Syncing layouts globally (Note: Discord global registration takes up to 1 hour)...');
      await client.rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commandsJSON }
      );
      logger.info('✅ Slash commands successfully registered globally!');
    }
  } catch (error) {
    logger.error('❌ Failed to register slash commands with Discord API:', error);
  }
}
