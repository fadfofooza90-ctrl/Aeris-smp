import { Events } from "discord.js";
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

// Memory map to track user message intervals for spam detection
const spamMap = new Map();

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    if (message.author.bot || !message.content) return;

    // --- 1. CONFIG & BYPASS USERS SETUP ---
    const protectedUsers = [
      "864871855604498452",
      "1008719737825534043"
    ];

    // Whitelist/Bypass: If these users send a message, they bypass ALL AutoMod checks!
    if (protectedUsers.includes(message.author.id)) {
      return; 
    }

    // Load configuration for blocked words
    let config = { logChannelId: "1513984222346612805", blockedWords: ["nigger", "kys", "killyourself", "bitch"] };
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch { /* Fallback */ }


    // --- 2. ANTI-SPAM MECHANISM (5 messages within 5 seconds) ---
    const now = Date.now();
    const userId = message.author.id;
    
    if (!spamMap.has(userId)) {
      spamMap.set(userId, []);
    }
    
    const userLog = spamMap.get(userId);
    // Filter out timestamps older than 5 seconds (5000ms)
    const activeTimestamps = userLog.filter(timestamp => now - timestamp < 5000);
    activeTimestamps.push(now);
    spamMap.set(userId, activeTimestamps);

    if (activeTimestamps.length >= 5) {
      // Clear their tracker history immediately so it doesn't trigger multiple times in a row
      spamMap.set(userId, []);

      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      // Mute penalty threshold set strictly to 10 Minutes
      const spamMuteDuration = 10 * 60 * 1000;
      let spamMuteSuccess = true;

      if (message.member && message.member.moderatable) {
        await message.member.timeout(spamMuteDuration, 'AutoMod: Chat Spamming (5+ msgs/5s)')
          .catch(() => { spamMuteSuccess = false; });
      } else {
        spamMuteSuccess = false;
      }

      const logChannel = message.client.channels.cache.get(config.logChannelId);
      if (logChannel) {
        const muteStatus = spamMuteSuccess ? "and has been muted for 10 Minutes ⏳" : "(Failed to mute - check permissions)";
        await logChannel.send({
          content: `🚨 **AutoMod Spam Alert:** ${message.author.tag} (${message.author.id}) was flagged for spamming messages ${muteStatus}`
        }).catch(() => null);
      }

      const spamWarning = await message.channel.send({
        content: `❌ ${message.author}, Please slow down! You have been muted for 10 Minutes for flooding the chat.`
      }).catch(() => null);

      if (spamWarning) {
        setTimeout(() => spamWarning.delete().catch(() => null), 6000);
      }
      return;
    }


    // --- 3. RUN SELECTION SCANS FOR WORD/PING VIOLATIONS ---
    const cleanContent = message.content.toLowerCase();
    const triggeredWord = config.blockedWords.find(word => cleanContent.includes(word));
    const triggeredPing = protectedUsers.find(id => message.mentions.users.has(id));

    // --- HANDLE ANTI-PING FIRST (DELETE ONLY) ---
    if (triggeredPing) {
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      const logChannel = message.client.channels.cache.get(config.logChannelId);
      if (logChannel) {
        await logChannel.send({
          content: `🗑️ **Anti-Ping Log:** Deleted a message from ${message.author.tag} (${message.author.id}) for pinging a protected staff ID.`
        }).catch(() => null);
      }

      const warning = await message.channel.send({
        content: `❌ ${message.author}, You cannot ping this person.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
      return; 
    }

    // --- HANDLE BLACKLISTED WORDS (DELETE + 2 HOUR MUTE) ---
    if (triggeredWord) {
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      const muteDuration = 2 * 60 * 60 * 1000; // Locked 2 Hours
      let muteSuccess = true;

      if (message.member && message.member.moderatable) {
        await message.member.timeout(muteDuration, `Triggered AutoMod blacklist: "${triggeredWord}"`)
          .catch(() => { muteSuccess = false; });
      } else {
        muteSuccess = false;
      }

      const logChannel = message.client.channels.cache.get(config.logChannelId);
      if (logChannel) {
        const muteStatusText = muteSuccess 
          ? `and has been muted for 2 Hours ⏳` 
          : "(Failed to mute - check hierarchy permissions)";
          
        await logChannel.send({
          content: `⚠️ **AutoMod Log:** ${message.author.tag} (${message.author.id}) sayed \`${triggeredWord}\` message deleted ${muteStatusText}`
        }).catch(() => null);
      }

      const warning = await message.channel.send({
        content: `❌ ${message.author}, That vocabulary or phrase is not permitted. You have been muted for 2 Hours.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 5000);
      }
    }
  },
};
