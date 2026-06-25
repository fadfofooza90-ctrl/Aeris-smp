import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js'; // Adjust paths based on your framework layout
import { logger } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName("issue")
        .setDescription("Report an issue with required photo or video proof")
        .addStringOption((option) =>
            option
                .setName("description")
                .setDescription("Describe the issue you encountered")
                .setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("Upload proof (Photo or Video file)")
                .setRequired(true), // 🔒 Enforces that proof is completely required
        ),
    category: "utility",

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction, { ephemeral: true });
        if (!deferSuccess) return;

        const description = interaction.options.getString("description");
        const proofAttachment = interaction.options.getAttachment("proof");

        // Validate that the uploaded file is either an image or a video format
        const contentType = proofAttachment.contentType || "";
        const isImage = contentType.startsWith("image/");
        const isVideo = contentType.startsWith("video/");

        if (!isImage && !isVideo) {
            return await InteractionHelper.safeEditReply(interaction, {
                content: "❌ **Invalid File Format:** Please upload a valid image (PNG/JPG) or video file (MP4/MOV/WebM) as proof.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Build your staff notification/log issue embed
            const issueEmbed = new EmbedBuilder()
                .setTitle("🚨 New Issue Reported")
                .setDescription(`**Reporter:** ${interaction.user} (${interaction.user.tag})\n**Details:** ${description}`)
                .setColor(0xFF0000)
                .setTimestamp();

            // Set image preview ONLY if it's a structural image format
            if (isImage) {
                issueEmbed.setImage(proofAttachment.url);
            } else if (isVideo) {
                issueEmbed.addFields({ name: "🎬 Video Proof", value: `[Click here to view video attached below](${proofAttachment.url})` });
            }

            // Get your target log or support channel id from your configuration mapping
            const logChannelId = config?.logChannelId || "1513984222346612805";
            const logChannel = interaction.guild.channels.cache.get(logChannelId);

            if (logChannel) {
                // If it is a video, we append the URL/file directly to the message payload so Discord renders the media player inline!
                await logChannel.send({
                    embeds: [issueEmbed],
                    content: isVideo ? `🎬 **Video Attachment Link:** ${proofAttachment.url}` : null
                });
            }

            // Confirm submission success back to the user safely
            await InteractionHelper.safeEditReply(interaction, {
                content: "✅ Your issue report has been successfully submitted to the administration team with your proof attached.",
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            logger.error('Error handling issue submission:', error);
            await InteractionHelper.safeEditReply(interaction, {
                content: "❌ An error occurred while trying to process your issue submission.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
