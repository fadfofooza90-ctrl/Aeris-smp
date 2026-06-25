import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

// Named exports to ensure compatibility with all types of command loaders
export const data = new SlashCommandBuilder()
  .setName('media')
  .setDescription('View requirements and submit your credentials for the Media Rank');

export const category = 'Moderation'; 

export async function execute(interaction, config, client) {
  try {
    // 1. Create the persistent green button layout panel
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('check_media_reqs')
        .setLabel('Check Requirements & Apply')
        .setStyle(ButtonStyle.Success)
    );

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

    // Send response directly using standard discord.js method
    await interaction.reply({
      embeds: [reqsEmbed],
      components: [row]
    });

  } catch (error) {
    // This will print the EXACT error to your terminal window if something goes wrong
    console.error('============================');
    console.error('❌ MEDIA COMMAND RUNTIME ERROR:');
    console.error(error);
    console.error('============================');

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ An internal error occurred while executing this command. Check bot console logs.', 
        ephemeral: true 
      }).catch(() => null);
    }
  }
}

// ─── STAGE TWO: MODAL SUBMIT CONTROLLER ──────────────────────────────────────
export async function handleMediaModalSubmit(interaction, client) {
  try {
    // Use standard native defer to prevent breaking if custom interaction helpers fail
    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const tiktokProfile = interaction.fields.getTextInputValue('modal_tiktok_profile');
    const tiktokVideo = interaction.fields.getTextInputValue('modal_tiktok_video');
    const mcName = interaction.fields.getTextInputValue('modal_mc_name');
    const discordName = interaction.fields.getTextInputValue('modal_discord_name');

    // Basic URL pattern checks
    if (!tiktokProfile.includes('tiktok.com') || !tiktokVideo.includes('tiktok.com')) {
      return await interaction.editReply({
        content: '❌ **Submission Error:** Please supply valid, complete TikTok profile and video hyperlinks.'
      });
    }

    // Hardcoded target logs dashboard feed routing channel
    const staffReviewChannelId = '1513984222346612806'; 
    const reviewChannel = client.channels.cache.get(staffReviewChannelId);

    if (reviewChannel) {
      const reviewEmbed = new EmbedBuilder()
        .setTitle('🎥 Media Rank Evaluation Profile')
        .setColor('#3498DB')
        .addFields(
          { name: '👤 Member Account', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
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
    console.error('============================');
    console.error('❌ MEDIA MODAL PROCESSING ERROR:');
    console.error(error);
    console.error('============================');
  }
}

// Export both default object and individual tokens to guarantee compliance with your system layout loader
export default { data, category, execute };
