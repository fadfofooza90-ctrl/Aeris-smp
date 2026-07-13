import { Events, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getGuildConfig } from '../services/guildConfig.js';
import { handleApplicationModal } from '../commands/Community/apply.js';
import { handleApplicationReviewModal } from '../commands/Community/app-admin.js';
import { handleInteractionError, createError, ErrorTypes } from '../utils/errorHandler.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { createInteractionTraceContext, runWithTraceContext } from '../utils/traceContext.js';
import { validateChatInputPayloadOrThrow } from '../utils/commandInputValidation.js';
import { enforceAbuseProtection, formatCooldownDuration } from '../utils/abuseProtection.js';
import { isCommandEnabled } from '../services/commandAccessService.js';
import { resolveSlashAccessKey } from '../utils/messageAdapter.js';
import { isCollectorManagedComponent } from '../utils/collectorComponents.js';
import { ResponseCoordinator } from '../utils/responseCoordinator.js';

function withTraceContext(context = {}, traceContext = {}) {
  return {
    traceId: traceContext.traceId,
    guildId: context.guildId || traceContext.guildId,
    userId: context.userId || traceContext.userId,
    command: context.commandName || traceContext.command,
    ...context
  };
}

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const interactionTraceContext = createInteractionTraceContext(interaction);
    interaction.traceContext = interactionTraceContext;

    return runWithTraceContext(interactionTraceContext, async () => {
      try {
        InteractionHelper.patchInteractionResponses(interaction);
        ResponseCoordinator.attach(interaction);

        if (interaction.isChatInputCommand()) {
          // ... (Keep your existing ChatInputCommand logic here)
          const command = client.commands.get(interaction.commandName);
          if (command) await command.execute(interaction, null, client);
        
        } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
          
          // --- QUEUE & ADMIN LOGIC ---
          const ADMIN_CHANNEL_ID = '1526299637235978240';

          // 1. Join / Leave Queue
          if (interaction.customId === 'queue_join' || interaction.customId === 'queue_leave') {
            const embed = interaction.message.embeds[0];
            let lines = embed.description.split('\n');
            let header = lines.slice(0, 4).join('\n');
            let queueLines = lines.slice(4).filter(l => l.trim() !== '' && l.trim() !== '(No one is in the queue yet.)');
            
            const userMention = `<@${interaction.user.id}>`;
            if (interaction.customId === 'queue_join' && !queueLines.includes(userMention)) queueLines.push(userMention);
            if (interaction.customId === 'queue_leave') queueLines = queueLines.filter(l => l !== userMention);

            const newDesc = `${header}\n${queueLines.length > 0 ? queueLines.join('\n') : '(No one is in the queue yet.)'}`;
            await interaction.update({ embeds: [EmbedBuilder.from(embed).setDescription(newDesc)] });

            // Sync Admin Panel
            const channel = interaction.guild.channels.cache.get(ADMIN_CHANNEL_ID);
            const messages = await channel.messages.fetch({ limit: 10 });
            const adminMsg = messages.find(m => m.embeds[0]?.title === '⚙️ Admin Queue Controls');
            if (adminMsg) {
              const options = queueLines.length > 0 ? queueLines.map(line => ({ label: line.replace(/[<@!>]/g, ''), value: line.match(/\d+/)[0] })) : [{ label: 'No one', value: 'none' }];
              const newSelect = new StringSelectMenuBuilder().setCustomId('admin_remove_select').setPlaceholder('Remove user').setOptions(options);
              await adminMsg.edit({ components: [adminMsg.components[0], new ActionRowBuilder().addComponents(newSelect)] });
            }
            return;
          }

          // 2. Admin Ticket Button
          if (interaction.customId === 'admin_ticket') {
            // Logic to trigger your ticket creation system
            return await interaction.reply({ content: '🎟️ Ticket created for user #1!', ephemeral: true });
          }

          // 3. Admin Remove Select Menu
          if (interaction.customId === 'admin_remove_select') {
            const userId = interaction.values[0];
            return await interaction.reply({ content: `Removed <@${userId}> from queue.`, ephemeral: true });
          }

          // --- EXISTING COMPONENT HANDLERS ---
          if (interaction.customId.startsWith('shared_todo_')) {
             const [type, ...args] = interaction.customId.split('_');
             const button = client.buttons.get(type);
             if (button) await button.execute(interaction, client, args);
             return;
          }

          const [customId, ...args] = interaction.customId.split(':');
          const button = client.buttons.get(customId);
          if (button) await button.execute(interaction, client, args);
        }
      } catch (error) {
        logger.error('Error in interactionCreate:', { error });
      }
    });
  }
};
