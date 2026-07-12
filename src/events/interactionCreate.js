import { Events, MessageFlags, EmbedBuilder } from 'discord.js';
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
    interaction.traceId = interactionTraceContext.traceId;

    return runWithTraceContext(interactionTraceContext, async () => {
      try {
        InteractionHelper.patchInteractionResponses(interaction);
        ResponseCoordinator.attach(interaction);

        if (interaction.isChatInputCommand()) {
          // ... (Existing ChatInputCommand logic)
          try {
            logger.info(`Command executed: /${interaction.commandName} by ${interaction.user.tag}`, {
              event: 'interaction.command.received',
              traceId: interactionTraceContext.traceId,
              guildId: interaction.guildId,
              userId: interaction.user?.id,
              command: interaction.commandName
            });

            validateChatInputPayloadOrThrow(interaction, withTraceContext({
              type: 'command_input_validation',
              commandName: interaction.commandName
            }, interactionTraceContext));

            const command = client.commands.get(interaction.commandName);
            if (!command) {
              throw createError(
                `No command matching ${interaction.commandName} was found.`,
                ErrorTypes.CONFIGURATION,
                'Sorry, that command does not exist.',
                withTraceContext({ commandName: interaction.commandName }, interactionTraceContext)
              );
            }

            const abuseProtection = await enforceAbuseProtection(interaction, command, interaction.commandName);
            if (!abuseProtection.allowed) {
              const formattedCooldown = formatCooldownDuration(abuseProtection.remainingMs);
              throw createError(
                `Risky command cooldown active for ${interaction.commandName}`,
                ErrorTypes.RATE_LIMIT,
                `This command is on cooldown. Please wait ${formattedCooldown} before trying again.`,
                withTraceContext({
                  commandName: interaction.commandName,
                  subtype: 'command_cooldown',
                  expected: true,
                  cooldownMs: abuseProtection.remainingMs,
                  cooldownWindowMs: abuseProtection.policy?.windowMs,
                  cooldownMaxAttempts: abuseProtection.policy?.maxAttempts
                }, interactionTraceContext)
              );
            }

            let guildConfig = null;
            if (interaction.guild) {
              guildConfig = await getGuildConfig(client, interaction.guild.id, interactionTraceContext);
              const accessKey = resolveSlashAccessKey(interaction);
              if (!(await isCommandEnabled(client, interaction.guild.id, accessKey, command.category))) {
                throw createError(
                  `Command ${accessKey} is disabled in this guild`,
                  ErrorTypes.CONFIGURATION,
                  'This command has been disabled for this server.',
                  withTraceContext({ commandName: accessKey, guildId: interaction.guild.id }, interactionTraceContext)
                );
              }
            }

            await command.execute(interaction, guildConfig, client);
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({
              type: 'command',
              commandName: interaction.commandName
            }, interactionTraceContext));
          }
        } else if (interaction.isAutocomplete()) {
          // ... (Existing Autocomplete logic)
          const autocompleteCommand = client.commands.get(interaction.commandName);
          if (autocompleteCommand?.autocomplete) {
            try {
              await autocompleteCommand.autocomplete(interaction, client);
            } catch (error) {
              await interaction.respond([]).catch(() => {});
            }
            return;
          }
        } else if (interaction.isButton()) {
          
          // --- UPDATED QUEUE LOGIC ---
          if (interaction.customId === 'queue_join' || interaction.customId === 'queue_leave') {
            const embed = interaction.message.embeds[0];
            if (!embed || !embed.description) return;

            let lines = embed.description.split('\n');
            let header = lines.slice(0, 4).join('\n');
            let queueLines = lines.slice(4).filter(line => line.trim() !== '' && line.trim() !== '(No one is in the queue yet.)');
            
            const userMention = `<@${interaction.user.id}>`;

            if (interaction.customId === 'queue_join') {
              if (!queueLines.includes(userMention)) queueLines.push(userMention);
            } else {
              queueLines = queueLines.filter(line => line !== userMention);
            }

            const newDescription = `${header}\n${queueLines.length > 0 ? queueLines.join('\n') : '(No one is in the queue yet.)'}`;
            const updatedEmbed = EmbedBuilder.from(embed).setDescription(newDescription);
            
            return await interaction.update({ embeds: [updatedEmbed] });
          }
          // --- END UPDATED QUEUE LOGIC ---

          if (interaction.customId.startsWith('shared_todo_')) {
             const parts = interaction.customId.split('_');
             const buttonType = parts.slice(0, 3).join('_');
             const listId = parts[3];
             const button = client.buttons.get(buttonType);
             if (button) {
               try { await button.execute(interaction, client, [listId]); } 
               catch (error) { await handleInteractionError(interaction, error, withTraceContext({ type: 'button', customId: interaction.customId, handler: 'todo' }, interactionTraceContext)); }
             }
             return;
          }

          const [customId, ...args] = interaction.customId.split(':');
          const button = client.buttons.get(customId);

          if (!button) {
            if (!interaction.customId.includes(':') || isCollectorManagedComponent(customId)) return;
            throw createError(`No button handler found for ${customId}`, ErrorTypes.CONFIGURATION, 'This button is not available.', withTraceContext({ customId }, interactionTraceContext));
          }

          try { await button.execute(interaction, client, args); } 
          catch (error) { await handleInteractionError(interaction, error, withTraceContext({ type: 'button', customId: interaction.customId, handler: 'general' }, interactionTraceContext)); }
        }
      } catch (error) {
        logger.error('Unhandled error in interactionCreate:', { error, traceId: interactionTraceContext.traceId });
      }
    });
  }
};
