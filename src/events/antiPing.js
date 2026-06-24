import { Events } from "discord.js";

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Immediate escape hatches for maximum speed
    if (message.author.bot || !message.content) return;

    // Fast check for your exact User ID or text username
    if (message.content.includes('1008719737825534043') || message.content.includes('@l1xzzn')) {
      
      // Fire the delete request immediately
      message.delete().catch(() => null);

      // Send the updated warning message
      const warning = await message.channel.send({
        content: `❌ ${message.author}, You cannot ping this person`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
    }
  },
};
