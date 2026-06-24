import { Events } from "discord.js";
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Immediate escape hatches for maximum speed
    if (message.author.bot || !message.content) return;

    // --- PROTECTED USERS LIST ---
    // Both user IDs are now fully loaded into the core scanner!
    const protectedUsers = [
      "864871855604498452",
      "1008719737825534043"
    ];

    // Accurate collector check ensures sneaky pings or custom tags can't bypass it
    const triggeredPing = protectedUsers.find(id => message.mentions.users.has(id));

    if (triggeredPing) {
      // 1. Fire the delete request immediately
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      // 2. Lock down an automatic 2-Hour timeout penalty
      const muteDuration = 2 * 60 * 60 * 1000;
      let muteSuccess = true;

      if (message.member && message.member.moderatable) {
        await message.member.timeout(muteDuration, `Mentioned a protected system user account (${triggeredPing})`)
          .catch(() => { muteSuccess = false; });
      } else {
        muteSuccess = false;
      }

      // 3. Read the shared log target dynamically
      let logChannelId = "1513984222346612805"; 
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.logChannelId) logChannelId = config.logChannelId;
      } catch { /* Fallback */ }

      // 4. Dispatch the incident details to the staff feed
      const logChannel = message.client.channels.cache.get(logChannelId);
      if (logChannel) {
        const muteStatusText = muteSuccess 
          ? `and has been muted for 2 Hours ⏳` 
          : "(Failed to mute - check hierarchy permissions)";

        await logChannel.send({
          content: `⚠️ **Anti-Ping Log:** ${message.author.tag} (${message.author.id}) pinged a protected staff ID, message deleted ${muteStatusText}`
        }).catch(() => null);
      }

      // 5. Send the self-cleaning warning message to the chat channel
      const warning = await message.channel.send({
        content: `❌ ${message.author}, You cannot ping this person. You have been muted for 2 Hours.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
    }
  },
};
