import { Events, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./automodConfig.json');

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
        return { 
            logChannelId: "1513984222346612805", 
            blockedWords: ["nigger", "kys", "killyourself", "bitch", "nigga", "nga", "mf", "motherfucker", "dumbfuck", "niga", "nigero", "sex" "bitches"],
            inviteProtection: true,
            aiVisionModeration: true
        };
    }
}

// Fixed function declaration typo here
async function scanImageForNSFW(imageUrl) {
    const SIGHTENGINE_USER = 'YOUR_SIGHTENGINE_USER_ID'; 
    const SIGHTENGINE_SECRET = 'YOUR_SIGHTENGINE_API_SECRET';

    if (SIGHTENGINE_USER === 'YOUR_SIGHTENGINE_USER_ID') return false;

    try {
        const response = await fetch(
            `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(imageUrl)}&models=nudity-2.0&api_user=${SIGHTENGINE_USER}&api_secret=${SIGHTENGINE_SECRET}`
        );
        const data = await response.json();

        if (data.status === 'success') {
            const nudity = data.nudity;
            if (nudity.sexual_activity > 0.50 || nudity.sexual_display > 0.50 || nudity.erotica > 0.60) {
                return true; 
            }
        }
        return false;
    } catch (error) {
        console.error('AI Moderation Connection Error:', error);
        return false;
    }
}

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        // 1. Core safety check: Ignore bots and DMs
        if (message.author.bot || !message.guild) return;

        // 2. USER WHITELIST BYPASS
        const whitelistedUsers = ['1008719737825534043', '864871855604498452'];
        if (whitelistedUsers.includes(message.author.id)) return; // Completely ignores them

        // 3. STAFF ROLE BYPASS
        const config = readConfig();
        const allowedRoles = ['1513984221587181637', '1513984221587181636'];
        const isStaff = message.member?.roles.cache.some(role => allowedRoles.includes(role.id));
        if (isStaff) return;

        const logChannel = message.guild.channels.cache.get(config.logChannelId);
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 Minutes

        // ─── VECTOR 1: DISCORD INVITE LINKS ─────────────────────────────────
        if (config.inviteProtection) {
            const inviteRegex = /(discord\.(gg|io|me|li)\/.+|discord\.com\/invite\/.+)/i;
            if (inviteRegex.test(message.content)) {
                await message.delete().catch(() => null);
                await message.member.timeout(TIMEOUT_DURATION, 'AutoMod: Sent server invite link.').catch(() => null);

                const warnMsg = await message.channel.send(`⚠️ ${message.author}, advertising other servers is not allowed. You have been muted for 30 minutes.`);
                setTimeout(() => warnMsg.delete().catch(() => null), 6000);

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🛡️ AutoMod Link Protection')
                        .setColor('#FF0000')
                        .addFields(
                            { name: '👤 Offender', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                            { name: '⏱️ Action', value: 'Deleted & 30 Min Mute', inline: true },
                            { name: '📄 Link Posted', value: `\`\`\`${message.content}\`\`\`` }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
                }
                return;
            }
        }

        // ─── VECTOR 2: AI NSFW ATTACHMENT SCANNER ────────────────────────────
        if (config.aiVisionModeration && message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(attachment.name);
                if (!isImage) continue;

                const isExplicit = await scanImageForNSFW(attachment.url);
                if (isExplicit) {
                    await message.delete().catch(() => null);
                    await message.member.timeout(TIMEOUT_DURATION, 'AutoMod AI: Uploaded Explicit Content.').catch(() => null);

                    const warnMsg = await message.channel.send(`❌ ${message.author}, NSFW/Explicit files are strictly prohibited. You have been muted for 30 minutes.`);
                    setTimeout(() => warnMsg.delete().catch(() => null), 6000);

                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('🚨 AutoMod AI Vision Violation')
                            .setDescription('AI intercepted explicit visual media.')
                            .setColor('#8B0000')
                            .addFields(
                                { name: '👤 Offender', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                                { name: '⏱️ Action Applied', value: 'Wiped Data & 30 Min Mute', inline: true },
                                { name: '🖼️ File Name', value: `\`${attachment.name}\``, inline: false }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
                    }
                    break;
                }
            }
        }

        // ─── VECTOR 3: STANDARD WORD BLACKLIST ─────────────────────────────
        const messageLower = message.content.toLowerCase();
        const hasBlockedWord = config.blockedWords.some(word => messageLower.includes(word));
        
        if (hasBlockedWord) {
            await message.delete().catch(() => null);
            await message.member.timeout(2 * 60 * 60 * 1000, 'AutoMod: Blacklisted phrase.').catch(() => null);

            const warnMsg = await message.channel.send(`❌ ${message.author}, that phrase is banned in this server.`);
            setTimeout(() => warnMsg.delete().catch(() => null), 5000);

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛡️ AutoMod Phrase Matched')
                    .setColor('#FF0000')
                    .addFields(
                        { name: '👤 User', value: `${message.author}`, inline: true },
                        { name: '⏱️ Action Taken', value: '2 Hours Mute', inline: true },
                        { name: '📄 Message Context', value: `\`\`\`${message.content}\`\`\`` }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }
        }
    }
};
