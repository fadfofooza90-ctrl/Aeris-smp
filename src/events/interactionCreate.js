import { Events, MessageFlags, EmbedBuilder } from 'discord.js';
import { handleMediaModalSubmit } from '../commands/moderation/media.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      // 1. Handle Slash Commands Safely
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Execute the command with empty config fallback to prevent crashes
        await command.execute(interaction, {}, client);
      } 
      
      // 2. Handle the Media Modal Submission safely
      else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'media_app_modal') {
          await handleMediaModalSubmit(interaction, client);
        }
      }
    } catch (error) {
      console.error('⚠️ CRITICAL INTERACTION ERROR:', error);
      
      // Safe fallback message to the user so Discord doesn't hang
      const errorMessage = {
        content: '❌ An internal error occurred while processing this action.',
        flags: MessageFlags.Ephemeral
      };
      
      try {
        if (interaction.deferred) await interaction.editReply(errorMessage);
        else if (interaction.replied) await interaction.followUp(errorMessage);
        else await interaction.reply(errorMessage);
      } catch (e) {
        console.error('Failed to send error fallback payload:', e);
      }
    }
  }
};
