import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    EmbedBuilder
} from 'discord.js';

// CHANGE THIS to your own user ID so it can send you error alerts!
const DEVELOPER_USER_ID = '1008719737825534043'; 
const TARGET_CHANNEL_ID = '1514214180973051925';

export default {
    slashOnly: true,
    data: new SlashCommandBuilder()
        .setName('sendrules')
        .setDescription('Sends the interactive Rules panel to the rules channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    category: 'Utility',

    async execute(interaction, guildConfig, client) {
        try {
            // 1. Instantly defer so Discord stops saying "The application did not respond"
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // 2. Fetch target channel
            const targetChannel = interaction.guild.channels.cache.get(TARGET_CHANNEL_ID) 
                ?? await interaction.guild.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

            if (!targetChannel || !targetChannel.isTextBased()) {
                return await interaction.editReply({
                    content: `❌ **Setup Error:** Could not find a valid text channel with ID \`${TARGET_CHANNEL_ID}\`.`
                });
            }

            // 3. Build the primary menu embed manually using standard discord.js
            const hubEmbed = new EmbedBuilder()
                .setTitle('📜 Server Information & Guidelines')
                .setDescription('Welcome to Flow SMP! Please select one of the buttons below to review our server rules, ban durations, and client restrictions.')
                .setColor('#5865F2') // Blurple
                .setFooter({ text: 'Make sure to follow all guidelines to keep our community safe and fair.' });

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rules_basic')
                    .setLabel('Basic Rules & Punishments')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('rules_mods')
                    .setLabel('Banned Mods')
                    .setEmoji('🛡️')
                    .setStyle(ButtonStyle.Danger)
            );

            // 4. Send the interface message
            await targetChannel.send({
                embeds: [hubEmbed],
                components: [buttonRow]
            });

            // 5. Report success back to the admin who executed it
            await interaction.editReply({ content: `✅ Panel successfully posted to <#${TARGET_CHANNEL_ID}>!` });

        } catch (error) {
            // EMERGENCY FALLBACK: Since you have no console, try sending the error to the channel or your DMs
            try {
                await interaction.editReply({
                    content: `⚠️ **An internal crash occurred:** \`\`\`js\n${error.stack || error.message}\n\`\`\``
                });

                const developer = await client.users.fetch(DEVELOPER_USER_ID).catch(() => null);
                if (developer) {
                    await developer.send({
                        content: `🚨 **Flow SMP Rules Menu Crash Alert:**\n\`\`\`js\n${error.stack || error.message}\n\`\`\``
                    }).catch(() => {});
                }
            } catch (fail) {
                // If it can't even reply, something is heavily broken with interaction states
            }
        }
    },
};
