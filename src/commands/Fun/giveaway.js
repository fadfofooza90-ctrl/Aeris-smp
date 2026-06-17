import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage server giveaways')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up a new giveaway message')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('What is the prize?')
                        .setRequired(true)
                )
                // Changed to an integer option so we can calculate a real live countdown timestamp
                .addIntegerOption(option =>
                    option.setName('duration_minutes')
                        .setDescription('How many minutes should the giveaway last?')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel where the giveaway message should be sent')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),
    category: "Fun",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'setup') {
                const prize = interaction.options.getString('prize');
                const durationMinutes = interaction.options.getInteger('duration_minutes');
                const targetChannel = interaction.options.getChannel('channel');
                const host = interaction.user;

                // Calculate future live countdown timestamp (seconds)
                const endTimestamp = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
                const discordLiveTime = `<t:${endTimestamp}:R>`; // Live ticking countdown string

                // Build your updated embed style matching your new text specs
                const giveawayEmbed = createEmbed()
                    .setColor('#00FF7F')
                    .setTitle(`Giveaway started on **${prize}**`)
                    .setDescription(`Click the button to enter the giveaway!`)
                    .addFields(
                        { name: '🎁 Prize', value: `**${prize}**`, inline: false },
                        { name: '⏳ Ends In', value: discordLiveTime, inline: true },
                        { name: '👑 Hosted By', value: `${host}`, inline: true }
                    )
                    .setFooter({ text: 'Make sure to enter before time runs out!' })
                    .setTimestamp();

                // Create the blue button to replace reactions
                const enterButton = new ButtonBuilder()
                    .setCustomId('enter_giveaway')
                    .setLabel('🎉 Enter')
                    .setStyle(ButtonStyle.Primary); // Blue button style

                const row = new ActionRowBuilder().addComponents(enterButton);

                // Send the giveaway message with the embed and button row
                await targetChannel.send({ embeds: [giveawayEmbed], components: [row] });

                await interaction.editReply({
                    content: `✅ Successfully started the live ticking giveaway for **${prize}** in ${targetChannel}!`
                });
            }

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
