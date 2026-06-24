import { Events } from "discord.js";
import { logger } from "../utils/logger.js";

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    // Escape early for bots or empty messages to save CPU cycles
    if (message.author.bot || !message.content) return;

    const cleanContent = message.content.toLowerCase();

    // 1. HARD BLOCK BLACKLIST (Instant Regex Matching for bypasses like k.y.s or n_i_g_g_e_r)
    const exactSlurs = [
      /\bn[i1l]gg[e3]r\b/i, 
      /\bkys\b/i, 
      /\bkill\s*your\s*self\b/i, 
      /\bb[i1l]tch\b/i
    ];

    const containsSevereSlur = exactSlurs.some(regex => regex.test(cleanContent));

    if (containsSevereSlur) {
      // Blast the message out of existence immediately
      if (message.deletable) {
        await message.delete().catch(() => null);
      }

      // Notify the channel cleanly
      const warning = await message.channel.send({
        content: `❌ ${message.author}, That vocabulary or phrase is not permitted on this network.`
      }).catch(() => null);

      if (warning) {
        setTimeout(() => warning.delete().catch(() => null), 4000);
      }
      return; // Stop execution here so we don't call an AI endpoint for obvious blocks
    }

    // 2. OPTIONAL: ADVANCED SEMANTIC EVALUATION (Context/Insults)
    // If you want to use OpenAI or a Moderation API for soft phrases, you can insert it below:
    /*
    try {
       // const aiResponse = await checkAIModeration(message.content);
       // if (aiResponse.flagged) { ... action ... }
    } catch(err) { logger.error(err); }
    */
  },
};
