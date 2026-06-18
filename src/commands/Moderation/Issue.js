import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Issue a network or server moderation action')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        // --- BAN SUBCOMMAND ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Log a player ban')
                .addStringOption(option =>
                    option.setName('minecraft_username')
                        .setDescription('The Minecraft IGN of the player')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the ban (e.g., Permanent, 30 Days, 560 Years)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this ban')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('discord_user')
                        .setDescription('The linked Discord user account (optional)')
                        .setRequired(false)
                )
        )
        // --- TIMEOUT SUBCOMMAND ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Log a player mute/timeout')
                .addStringOption(option =>
                    option.setName('minecraft_username')
                        .setDescription('The Minecraft IGN of the player')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('duration_minutes')
                        .setDescription('How many minutes should the timeout last? (Will count down live)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this timeout')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('discord_user')
                        .setDescription('The linked Discord user account (optional)')
                        .setRequired(false)
                )
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const subcommand = interaction.options.getSubcommand();
            const mcUsername = interaction.options.getString('minecraft_username');
            const reason = interaction.options.getString('reason');
            const discordUser = interaction.options.getUser('discord_user');
            const moderator = interaction.user;

            const discordUserValue = discordUser ? `${discordUser}` : 'Not Provided';

            // Secure local attachment handling for your star sky background banner
            const imageUrl = 'https://media.discordapp.net/ephemeral-attachments/1515885694852272258/1516152037505761300/Screenshot_2026-06-11_014315.png?ex=6a34e5de&is=6a33945e&hm=c2ddbc179b6f7a95dd78eb44d885b3f815957094d1e063c398345344d5a0c9cd&=&format=webp&quality=lossless&width=1872&height=921';
            const bannerAttachment = new AttachmentBuilder(imageUrl, { name: 'starry_sky.png' });

            // Create base layout structure with gray quote block styling markers inside fields
            const logEmbed = createEmbed()
                .setColor('#2F3136')
                .setAuthor({ 
                    name: `Issued by ♡`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setImage('attachment://starry_sky.png')
                .setFooter({ text: `Moderator ID: ${moderator.id}` })
                .setTimestamp();

            // --- PROCESS BAN LAYOUT ---
            if (subcommand === 'ban') {
                const durationString = interaction.options.getString('duration');

                logEmbed.setTitle('Moderation Log: Ban')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${durationString}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );
            }

            // --- PROCESS TIMEOUT LAYOUT (Live Ticking Countdown Tracker) ---
            else if (subcommand === 'timeout') {
                const durationMinutes = interaction.options.getInteger('duration_minutes');
                
                // Calculate dynamic live ticking end time string
                const expiryTimestamp = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
                const liveCountdownString = `<t:${expiryTimestamp}:R>`;

                logEmbed.setTitle('Moderation Log: Timeout')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${liveCountdownString}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );
            }

            // Output the final generated layout embed card straight to the channel
            await interaction.editReply({ 
                embeds: [logEmbed], 
                files: [bannerAttachment] 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
