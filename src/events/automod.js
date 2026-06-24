import { Events } from "discord.js";

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Escape early for bots or empty messages
    if (message.author.bot || !message.content) return;

    const cleanContent = message.content.toLowerCase();
    const logChannelId = '1513984222346612805';

    // Hard block word strings to quickly identify which exact word was used
    const blockedWords = ['nigger', 'kys', 'killyourself', 'bitch'];

    // Find if the message contains any of the blocked words
    const triggeredWord = blockedWords.find(word => cleanContent.includes(word));

    if (triggeredWord) {
      // 1. Delete the bad message out of chat instantly
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      // 2. Log it right away to the specified moderation logs channel
      const logChannel = message.client.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({
          content: `⚠️ **AutoMod Log:** ${message.author.tag} (${message.author.id}) sayed \`${triggeredWord}\` message deleted`
        }).catch(() => null);
      }

      // 3. Send a temporary warning to the user in the main chat channel
      const warning = await message.channel.send({
        content: `❌ ${message.author}, That vocabulary or phrase is not permitted on this network.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
    }
  },
};
