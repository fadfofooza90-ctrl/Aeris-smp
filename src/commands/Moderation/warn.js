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
                        .setDescription('Type "permanent" or enter minutes (e.g., 30 for 30 minutes)')
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
        )
        // --- WARN SUBCOMMAND ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Log a player warning and manage warning roles')
                .addStringOption(option =>
                    option.setName('minecraft_username')
                        .setDescription('The Minecraft IGN of the player')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for issuing this warning')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('discord_user')
                        .setDescription('The target Discord user account')
                        .setRequired(true) // Required here so the bot can apply roles
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
            
            const channelId = interaction.channelId; 
            const guild = interaction.guild;

            const discordUserValue = discordUser ? `${discordUser}` : 'Not Provided';

            const imageUrl = 'https://media.discordapp.net/attachments/1513984222346612804/1517159270158700705/landscape-minecraft-shaders-wallpaper-preview.jpg?ex=6a35442d&is=6a33f2ad&hm=eb90db56c0e456d322a944e7814a787c9af373bfa4786d1c6e8b9d09312c10e4&=&format=webp&width=1092&height=615';
            const bannerAttachment = new AttachmentBuilder(imageUrl, { name: 'landscape_banner.png' });

            const logEmbed = createEmbed()
                .setColor('#2F3136')
                .setAuthor({ 
                    name: `Issued by ${moderator.username}`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setImage('attachment://landscape_banner.png')
                .setFooter({ text: `Moderator ID: ${moderator.id}` })
                .setTimestamp();

            // --- PROCESS BAN LAYOUT ---
            if (subcommand === 'ban') {
                const durationInput = interaction.options.getString('duration').trim();
                let displayDuration = durationInput;
                const minutes = parseInt(durationInput, 10);

                if (!isNaN(minutes)) {
                    const expiryTimestamp = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
                    displayDuration = `<t:${expiryTimestamp}:R>`;

                    setTimeout(async () => {
                        const targetChannel = client.channels.cache.get(channelId);
                        if (targetChannel) {
                            await targetChannel.send({
                                content: `🔔 ${moderator}, the **${minutes} minute ban** duration for **${mcUsername}** is now over!`
                            }).catch(() => null);
                        }
                    }, minutes * 60 * 1000);
                }

                logEmbed.setTitle('Moderation Log: Ban')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${displayDuration}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );
            }

            // --- PROCESS TIMEOUT LAYOUT ---
            else if (subcommand === 'timeout') {
                const durationMinutes = interaction.options.getInteger('duration_minutes');
                const expiryTimestamp = Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000);
                const liveCountdownString = `<t:${expiryTimestamp}:R>`;

                logEmbed.setTitle('Moderation Log: Timeout')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Duration', value: `> ${liveCountdownString}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );

                setTimeout(async () => {
                    const targetChannel = client.channels.cache.get(channelId);
                    if (targetChannel) {
                        await targetChannel.send({
                            content: `🔔 ${moderator}, the **${durationMinutes} minute timeout** duration for **${mcUsername}** is now over!`
                        }).catch(() => null);
                    }
                }, durationMinutes * 60 * 1000);
            }

            // --- PROCESS WARN LAYOUT & STEPPING ROLE SYSTEM ---
            else if (subcommand === 'warn') {
                logEmbed.setTitle('Moderation Log: Warn')
                    .addFields(
                        { name: 'Discord User', value: `> ${discordUserValue}`, inline: false },
                        { name: 'Minecraft Username', value: `> ${mcUsername}`, inline: true },
                        { name: 'Reason', value: `> ${reason}`, inline: true }
                    );

                // Fetch the user within the server to manipulate their roles
                const member = await guild.members.fetch(discordUser.id).catch(() => null);

                if (member) {
                    // Find the tracking roles by their exact names
                    const warn1 = guild.roles.cache.find(r => r.name === '1 warnings');
                    const warn2 = guild.roles.cache.find(r => r.name === '2 warnings');
                    const warn3 = guild.roles.cache.find(r => r.name === '3 warnings');

                    let currentWarnLevel = 0;
                    if (warn3 && member.roles.cache.has(warn3.id)) currentWarnLevel = 3;
                    else if (warn2 && member.roles.cache.has(warn2.id)) currentWarnLevel = 2;
                    else if (warn1 && member.roles.cache.has(warn1.id)) currentWarnLevel = 1;

                    // Determine the new step level
                    const nextWarnLevel = currentWarnLevel + 1;

                    // Apply the correct role step variations
                    if (nextWarnLevel === 1 && warn1) {
                        await member.roles.add(warn1).catch(() => null);
                    } 
                    else if (nextWarnLevel === 2 && warn2) {
                        if (warn1) await member.roles.remove(warn1).catch(() => null);
                        await member.roles.add(warn2).catch(() => null);
                    } 
                    else if (nextWarnLevel >= 3 && warn3) {
                        if (warn2) await member.roles.remove(warn2).catch(() => null);
                        await member.roles.add(warn3).catch(() => null);

                        // Find the #staff-chat channel inside this specific guild to notify them
                        const staffChatChannel = guild.channels.cache.find(c => c.name === 'staff-chat');
                        if (staffChatChannel) {
                            await staffChatChannel.send({
                                content: `⚠️ **Attention** @Staff, the user ${discordUser} has reached **3 warnings**!`
                            }).catch(() => null);
                        }
                    }
                }
            }

            await interaction.editReply({ 
                embeds: [logEmbed], 
                files: [bannerAttachment] 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
