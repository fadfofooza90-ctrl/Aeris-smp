import { Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
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
        
        } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
          
          // 1. Join / Leave Queue Logic
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

          // 2. Admin Ticket Button
          if (interaction.customId === 'admin_ticket') {
            const [_, chanId, msgId] = interaction.message.content.split('|');
            const pubChannel = await interaction.guild.channels.fetch(chanId);
            const pubMsg = await pubChannel.messages.fetch(msgId);
            const queueLines = pubMsg.embeds[0].description.split('\n').filter(l => l.includes('<@'));
            
            if (queueLines.length === 0) return interaction.reply({ content: 'Queue is empty!', ephemeral: true });
            
            const firstUser = queueLines[0].match(/<@\d+>/)[0];
            return interaction.reply({ content: `🎟️ Ticket created for ${firstUser}!`, ephemeral: true });
          }
        }
      } catch (error) {
        logger.error('Error in interactionCreate:', { error });
      }
    });
  }
};
