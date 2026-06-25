import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

export default {
  data: new SlashCommandBuilder()
    .setName("issue")
    .setDescription("Report a user infraction or server issue to management")
    // 1. Bring back the core action types
    .addStringOption(option =>
      option.setName("type")
        .setDescription("Select the type of issue action")
        .setRequired(true)
        .addChoices(
          { name: "⚠️ Warn", value: "warn" },
          { name: "⏳ Timeout", value: "timeout" },
          { name: "🔨 Ban", value: "ban" }
        )
    )
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user this issue/action relates to")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason or details regarding this issue")
        .setRequired(true)
    )
    // 2. Proof is now strictly required and accepts photos/videos
    .addAttachmentOption(option =>
      option.setName("proof")
        .setDescription("Upload mandatory proof (Photo or Video file)")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Acknowledge interaction immediately 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);

    const issueType = interaction.options.getString("type");
    const targetUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const proofAttachment = interaction.options.getAttachment("proof");

    // Validate that the uploaded file matches expected media categories
    const contentType = proofAttachment.contentType || "";
    const isImage = contentType.startsWith("image/");
    const isVideo = contentType.startsWith("video/");

    if (!isImage && !isVideo) {
      return await interaction.editReply({
        content: "❌ **Invalid Proof Format:** Please upload a valid photo image (PNG/JPG) or video file (MP4/MOV/WebM)."
      }).catch(() => null);
    }

    // Pull your target tracking feed channel out of the server profile configurations
    let logChannelId = "1513984222346612805";
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.logChannelId) logChannelId = config.logChannelId;
    } catch { /* Fallback */ }

    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (!logChannel) {
      return await interaction.editReply({
        content: "❌ **Configuration Error:** Administration logging channel could not be resolved."
      }).catch(() => null);
    }

    // Set up display styling variables matching the selected issue path
    let actionLabel = "⚠️ Issue Report: Warning Request";
    let embedColor = 0xFFAA00; // Orange for warns

    if (issueType === "timeout") {
      actionLabel = "⏳ Issue Report: Timeout Request";
      embedColor = 0x3498DB; // Blue for timeouts
    } else if (issueType === "ban") {
      actionLabel = "🔨 Issue Report: Ban Request";
      embedColor = 0xE74C3C; // Red for bans
    }

    // Formulate final administration report layout
    const issueEmbed = new EmbedBuilder()
      .setTitle(actionLabel)
      .setColor(embedColor)
      .addFields(
        { name: "👤 Target User", value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
        { name: "✍️ Filed By", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
        { name: "📝 Details / Reason", value: reason }
      )
      .setTimestamp();

    // Map photo embed preview hooks if applicable
    if (isImage) {
      issueEmbed.setImage(proofAttachment.url);
    } else if (isVideo) {
      issueEmbed.addFields({ name: "🎬 Video Proof", value: `[Click here to jump straight to file attachment](${proofAttachment.url})` });
    }

    // Forward package array structures directly over to server logs
    await logChannel.send({
      embeds: [issueEmbed],
      // If it's a video file, append the raw asset link so Discord maps out the media play frame automatically!
      content: isVideo ? `🎬 **Attached Video Evidence:** ${proofAttachment.url}` : null
    }).catch(() => null);

    // Provide clean feedback response
    await interaction.editReply({
      content: `✅ Success! Your **${issueType}** issue profile regarding ${targetUser.tag} has been logged with management details.`
    }).catch(() => null);
  }
};
