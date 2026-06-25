import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ComponentType 
} from 'discord.js';

// Clean fallback utility imports in case your custom utils use different names
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

const mediaCommand = {
  data: new SlashCommandBuilder()
    .setName('media')
    .setDescription('View requirements and submit your credentials for the Media Rank'),
  category: 'Moderation',

  async execute(interaction, config, client) {
    try {
      // 1. Setup the active button trigger layout
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('check_media_reqs')
          .setLabel('Check Requirements & Apply')
          .setStyle(ButtonStyle.Success)
      );

      // Using standard EmbedBuilder to ensure zero errors if createEmbed() path fails
      const reqsEmbed = new EmbedBuilder()
        .setTitle('🎥 Flow SMP | Media Team Application')
        .setColor('#2ECC71')
        .setDescription(
          'Are you an active creator publishing TikTok videos on our network?\n\n' +
          '📊 **Core Verification Metrics Required:**\n' +
          '• Your channel must have at least **10 videos** published.\n' +
          '• Your videos must consistently achieve **200+ views** each.\n\n' +
          '👉 **Click the green validation button below** to fill out your creator profile and request status review!'
        )
        .setFooter({ text: 'Flow SMP Media Administration' })
        .setTimestamp();

      // Send the tracking interface station down to the channel feed
      await interaction.reply({
        embeds: [reqsEmbed],
        components: [row]
      });

    } catch (error) {
      if (typeof handleInteractionError === 'function') {
        await handleInteractionError(interaction, error);
      } else {
        console.error('Error executing media command:', error);
      }
    }
  }
};

// Exporting both default and named properties to guarantee compatibility with your loader
export default mediaCommand;
export { mediaCommand as command };

// ─── STAGE TWO: INTERACTION SUBMIT CONTROLLER ────────────────────────────────
export async function handleMediaModalSubmit(interaction, client) {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'media_app_modal') {
    try {
      // Use framework's safe defer or standard defer
      if (InteractionHelper && typeof InteractionHelper.safeDefer === 'function') {
        await InteractionHelper.safeDefer(interaction, { ephemeral: true });
      } else {
        await interaction.deferReply({ ephemeral: true }).catch(() => null);
      }

      const tiktokProfile = interaction.fields.getTextInputValue('modal_tiktok_profile');
      const tiktokVideo = interaction.fields.getTextInputValue('modal_tiktok_video');
      const mcName = interaction.fields.getTextInputValue('modal_mc_name');
      const discordName = interaction.fields.getTextInputValue('modal_discord_name');

      // Reject data strings that don't match typical platform routing layout structures
      if (!tiktokProfile.includes('tiktok.com') || !tiktokVideo.includes('tiktok.com')) {
        return await interaction.editReply({
          content: '❌ **Submission Error:** Please supply valid, complete TikTok profile and video hyperlinks.'
        });
      }

      // Hard-coded log stream destination mapping channels
      const staffReviewChannelId = '1513984222346612806'; 
      const reviewChannel = client.channels.cache.get(staffReviewChannelId);

      if (reviewChannel) {
        const reviewEmbed = new EmbedBuilder()
          .setTitle('🎥 Media Rank Evaluation Profile')
          .setColor('#3498DB')
          .addFields(
            { name: '👤 Member account', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
            { name: '🎮 In-game IGN', value: `\`${mcName}\``, inline: true },
            { name: '💬 Discord Provided', value: `\`${discordName}\``, inline: true },
            { name: '🔗 Channel Destination', value: `[Open Profile Link](${tiktokProfile})`, inline: false },
            { name: '🎬 Submitted Video', value: `[Open Video Link](${tiktokVideo})`, inline: false }
          )
          .setDescription('⚠️ **Staff Notice:** Run manually directed account audits to confirm they possess **10+ videos with 200+ views each** before processing rank flags.')
          .setTimestamp();

        await reviewChannel.send({ embeds: [reviewEmbed] }).catch(() => null);
      }

      await interaction.editReply({
        content: '✅ **Verification Pending!** Your channels have been routed to staff files for active data view metrics confirmation.'
      });

    } catch (error) {
      console.error('Modal execution crash:', error);
    }
  }
}
