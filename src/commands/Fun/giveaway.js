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

                const endTimestamp = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
                const discordLiveTime = `<t:${endTimestamp}:R>`;

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

                const enterButton = new ButtonBuilder()
                    .setCustomId('enter_giveaway')
                    .setLabel('🎉 Enter')
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder().addComponents(enterButton);

                const giveawayMessage = await targetChannel.send({ embeds: [giveawayEmbed], components: [row] });

                await interaction.editReply({
                    content: `✅ Successfully started the live ticking giveaway for **${prize}** in ${targetChannel}!`
                });

                // --- LIVE BUTTON HANDLING SYSTEM ---
                const entrants = new Set();
                const collector = giveawayMessage.createMessageComponentCollector({
                    filter: i => i.customId === 'enter_giveaway',
                    time: durationMinutes * 60 * 1000 
                });

                collector.on('collect', async btnInteraction => {
                    if (entrants.has(btnInteraction.user.id)) {
                        return await btnInteraction.reply({
                            content: '⚠️ You have already entered this giveaway!',
                            ephemeral: true
                        });
                    }

                    entrants.add(btnInteraction.user.id);
                    await btnInteraction.reply({
                        content: '🎉 You have successfully entered the giveaway! Good luck!',
                        ephemeral: true
                    });
                });

                collector.on('end', async () => {
                    // Disable the button when time expires so nobody can click anymore
                    const disabledButton = ButtonBuilder.from(enterButton).setDisabled(true).setLabel('Giveaway Ended');
                    const disabledRow = new ActionRowBuilder().addComponents(disabledButton);
                    
                    const endedEmbed = createEmbed()
                        .setColor('#FF0000')
                        .setTitle(`Giveaway ended on **${prize}**`)
                        .setDescription(`Entries are closed!`)
                        .addFields(
                            { name: '🎁 Prize', value: `**${prize}**`, inline: false },
                            { name: '⏳ Status', value: 'Ended', inline: true },
                            { name: '👑 Hosted By', value: `${host}`, inline: true }
                        )
                        .setFooter({ text: 'Time has run out!' })
                        .setTimestamp();

                    await giveawayMessage.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => null);
                });
            }

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
