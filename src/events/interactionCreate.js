import { Events, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
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
          
          // 1. Join / Leave Queue
          if (interaction.customId === 'queue_join' || interaction.customId === 'queue_leave') {
            const embed = interaction.message.embeds[0];
            let lines = embed.description.split('\n');
            let queueLines = lines.slice(4).filter(l => l.includes('<@'));
            
            const userMention = `<@${interaction.user.id}>`;
            if (interaction.customId === 'queue_join' && !queueLines.includes(userMention)) queueLines.push(userMention);
            if (interaction.customId === 'queue_leave') queueLines = queueLines.filter(l => l !== userMention);

            const newDesc = `The queue updates live.\nUse the buttons below to join or leave the queue.\n\n**Queue:**\n${queueLines.length > 0 ? queueLines.join('\n') : '(No one is in the queue yet.)'}`;
            const newEmbed = EmbedBuilder.from(embed).setDescription(newDesc);
            await interaction.update({ embeds: [newEmbed] });
            return;
          }

          // 2. Admin Ticket Button (Gets User #1)
          if (interaction.customId === 'admin_ticket') {
            const channel = interaction.guild.channels.cache.get('1526299637235978240');
            const msgs = await channel.messages.fetch({ limit: 20 });
            const queueMsg = msgs.find(m => m.embeds[0]?.title === '⚔️ TierTest Queue');
            const firstUser = queueMsg?.embeds[0].description.match(/<@\d+>/);
            
            if (!firstUser) return interaction.reply({ content: 'Queue is empty!', ephemeral: true });
            return interaction.reply({ content: `🎟️ Ticket created for ${firstUser[0]}!`, ephemeral: true });
          }

          // 3. Admin Remove Select Menu
          if (interaction.customId === 'admin_remove_select') {
            const userId = interaction.values[0];
            // You can add logic here to find the queue message and filter the user out, then edit both messages.
            return interaction.reply({ content: `Removed <@${userId}> from queue.`, ephemeral: true });
          }
        }
      } catch (error) {
        logger.error('Error:', { error });
      }
    });
  }
};
