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

// Paths adjusted to step up 2 folders out of /commands/moderation/ over to /utils/
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
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

      const reqsEmbed = createEmbed()
        .setTitle('🎥 Infuse-SMP | Media Team Application')
        .setColor('#2ECC71')
        .setDescription(
          'Are you an active creator publishing TikTok videos on our network?\n\n' +
          '📊 **Core Verification Metrics Required:**\n' +
          '• Your channel must have at least **10 videos** published.\n' +
          '• Your videos must consistently achieve **200+ views** each.\n\n' +
          '👉 **Click the green validation button below** to fill out your creator profile and request status review!'
        )
        .setFooter({ text: 'Infuse-SMP Media Administration' })
        .setTimestamp();

      // Send the tracking interface station down to the channel feed
      const menuMessage = await interaction.reply({
        embeds: [reqsEmbed],
        components: [row],
        fetchReply: true
      }).catch(() => null);

      if (!menuMessage) return;

      // 2. Open up the button collection window frame
      const collector = menuMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 0 // Remains active continuously
      });

      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.customId === 'check_media_reqs') {
          
          // 3. Build out the live modal text form fields
          const modal = new ModalBuilder()
            .setCustomId('media_app_modal')
            .setTitle('Media Rank Verification Form');

          const profileInput = new TextInputBuilder()
            .setCustomId('modal_tiktok_profile')
            .setLabel('Your TikTok Profile Link')
            .setPlaceholder('https://www.tiktok.com/@yourusername')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const videoInput = new TextInputBuilder()
            .setCustomId('modal_tiktok_video')
            .setLabel('Your Video Link')
            .setPlaceholder('https://www.tiktok.com/@username/video/...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const mcInput = new TextInputBuilder()
            .setCustomId('modal_mc_name')
            .setLabel('Your Minecraft Name (IGN)')
            .setPlaceholder('Enter your exact in-game name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const discordInput = new TextInputBuilder()
            .setCustomId('modal_discord_name')
            .setLabel('Your Discord Name')
            .setDefaultValue(buttonInteraction.user.username)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(profileInput),
            new ActionRowBuilder().addComponents(videoInput),
            new ActionRowBuilder().addComponents(mcInput),
            new ActionRowBuilder().addComponents(discordInput)
          );

          await buttonInteraction.showModal(modal).catch(() => null);
        }
      });

    } catch (error) {
      await handleInteractionError(error, interaction);
    }
  }
};

// ─── STAGE TWO: INTERACTION SUBMIT CONTROLLER ────────────────────────────────
export async function handleMediaModalSubmit(interaction, client) {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'media_app_modal') {
    try {
      const deferSuccess = await InteractionHelper.safeDefer(interaction, { ephemeral: true });
      if (!deferSuccess) return;

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
      await handleInteractionError(error, interaction);
    }
  }
}
