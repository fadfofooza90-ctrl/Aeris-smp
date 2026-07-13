import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { createInteractionTraceContext, runWithTraceContext } from '../utils/traceContext.js';
import { ResponseCoordinator } from '../utils/responseCoordinator.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const context = createInteractionTraceContext(interaction);
    return runWithTraceContext(context, async () => {
      try {
        InteractionHelper.patchInteractionResponses(interaction);
        ResponseCoordinator.attach(interaction);

        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (command) await command.execute(interaction, null, client);
        
        } else if (interaction.isButton()) {
          
          // 1. Join / Leave Queue Logic (Public)
          if (interaction.customId === 'queue_join' || interaction.customId === 'queue_leave') {
            const embed = interaction.message.embeds[0];
            let lines = embed.description.split('\n');
            let queueLines = lines.slice(4).filter(l => l.includes('<@'));
            
            const userMention = `<@${interaction.user.id}>`;
            if (interaction.customId === 'queue_join' && !queueLines.includes(userMention)) queueLines.push(userMention);
            if (interaction.customId === 'queue_leave') queueLines = queueLines.filter(l => l !== userMention);

            const newDesc = `The queue updates live.\nUse the buttons below to join or leave the queue.\n\n**Queue:**\n${queueLines.length > 0 ? queueLines.join('\n') : '(No one is in the queue yet.)'}`;
            await interaction.update({ embeds: [EmbedBuilder.from(embed).setDescription(newDesc)] });
            return;
          }

          // 2. Admin Ticket & Remove Logic (Updates Admin Panel View)
          if (interaction.customId.startsWith('admin_ticket') || interaction.customId.startsWith('admin_remove')) {
            const [action, chanId, msgId] = interaction.customId.split(':');
            const pubChannel = await interaction.guild.channels.fetch(chanId);
            const pubMsg = await pubChannel.messages.fetch(msgId);
            
            const pubEmbed = pubMsg.embeds[0];
            let queueLines = pubEmbed.description.split('\n').filter(l => l.includes('<@'));
            
            if (queueLines.length === 0) return interaction.reply({ content: 'Queue is empty!', ephemeral: true });

            let statusMessage = "";

            // If action is Remove
            if (action === 'admin_remove') {
                const removedUser = queueLines.shift();
                const newQueueText = queueLines.length > 0 ? queueLines.join('\n') : '(No one is in the queue yet.)';
                
                // Update Public Message
                const newPubDesc = `The queue updates live.\nUse the buttons below to join or leave the queue.\n\n**Queue:**\n${newQueueText}`;
                await pubMsg.edit({ embeds: [EmbedBuilder.from(pubEmbed).setDescription(newPubDesc)] });
                statusMessage = `✅ Removed ${removedUser} from queue.`;
            } 
            // If action is Ticket
            else if (action === 'admin_ticket') {
                statusMessage = `🎟️ Ticket created for ${queueLines[0]}!`;
            }

            // Update Admin Panel Embed to show current queue list
            const currentQueueList = queueLines.length > 0 ? queueLines.join('\n') : '(Queue is empty)';
            const adminEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setDescription(`Use the buttons below to manage the queue.\n\n**Queue:**\n${currentQueueList}\n\n${statusMessage}`);
            
            await interaction.update({ embeds: [adminEmbed] });
            return;
          }
        }
      } catch (error) {
        logger.error('Error in interactionCreate:', { error });
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ An error occurred.', ephemeral: true }).catch(() => {});
        }
      }
    });
  }
};
