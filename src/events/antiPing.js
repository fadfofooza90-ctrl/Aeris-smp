import { Events } from "discord.js";
import { logger } from "../utils/logger.js";

export default {
  name: Events.MessageCreate,
  once: false, // This needs to run every single time a message is sent

  async execute(message, client) {
    try {
      // Ignore messages sent by bots to prevent infinite loops
      if (message.author.bot) return;

      const targetId = '1008719737825534043';
      const targetUsername = 'l1xzzn';

      // Check if the user ID is explicitly mentioned, or if their username is typed as a clean mention string
      const mentionsUser = message.mentions.users.has(targetId);
      const typedMention = message.content.includes(`<@${targetId}>`) || message.content.includes(`@${targetUsername}`);

      if (mentionsUser || typedMention) {
        // 1. Delete the user's message right away
        if (message.deletable) {
          await message.delete().catch(() => null);
        }

        // 2. Reply to the channel letting them know they can't ping that person
        const warning = await message.channel.send({
          content: `❌ ${message.author}, Sorry You cant ping that person`
        });

        // 3. Automatically delete the bot's warning after 5 seconds to keep the chat clean (Optional)
        setTimeout(() => {
          warning.delete().catch(() => null);
        }, 5000);
      }
    } catch (error) {
      logger.error("Error running the anti-ping automatic event:", error);
    }
  },
};
