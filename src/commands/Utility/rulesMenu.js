import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

const TARGET_CHANNEL_ID = '1514214180973051925';

export default {
    slashOnly: true,
    data: new SlashCommandBuilder()
        .setName('sendrules')
        .setDescription('Sends the interactive Rules and Banned Mods selection panel to the rules channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    category: 'Utility',

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const targetChannel = interaction.guild.channels.cache.get(TARGET_CHANNEL_ID) 
                ?? await interaction.guild.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

            if (!targetChannel || !targetChannel.isTextBased()) {
                return await interaction.editReply({
                    embeds: [errorEmbed('Channel Not Found', `Could not find a valid text channel with ID \`${TARGET_CHANNEL_ID}\`.`)]
                });
            }

            // 1. Build the Hub View panel
            const hubEmbed = createEmbed({
                title: '📜 Server Information & Guidelines',
                description: 'Welcome! Please select one of the buttons below to review our official server rules and approved client modifications.',
                color: 'primary',
                footer: 'Make sure to follow all guidelines to keep our community safe and fair.'
            });

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rules_basic')
                    .setLabel('Basic Rules')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('rules_mods')
                    .setLabel('Banned Mods')
                    .setEmoji('🛡️')
                    .setStyle(ButtonStyle.Danger)
            );

            // Send the permanent panel message to the dedicated rules channel
            const panelMessage = await targetChannel.send({
                embeds: [hubEmbed],
                components: [buttonRow]
            });

            // 2. Set up the infinite collector to handle the button interactions
            const collector = panelMessage.createMessageComponentCollector({
                filter: (i) => i.customId === 'rules_basic' || i.customId === 'rules_mods',
                // No time limit so the button remains permanently active while the bot is online
            });

            collector.on('collect', async (btnInteraction) => {
                try {
                    // Always reply ephemrally so it doesn't clutter the channel for other users
                    await btnInteraction.deferReply({ flags: MessageFlags.Ephemeral });

                    if (btnInteraction.customId === 'rules_basic') {
                        const basicRulesEmbed = createEmbed({
                            title: '📋 Server Rules',
                            color: 'info',
                            description: 'Please review our community guidelines below. Use common sense if it feels unfair, or you will get banned for it.',
                            fields: [
                                { name: 'R1', value: 'No naked killing', inline: true },
                                { name: 'R2', value: 'No spawn camping', inline: true },
                                { name: 'R3', value: 'Lag machine', inline: true },
                                { name: 'R4', value: 'Wither spawning', inline: true },
                                { name: 'R5', value: 'Chat rules', inline: true },
                                { name: 'R6', value: 'No Stasis Chambers in combat', inline: true },
                                { name: 'R7', value: 'Pushing out of spawn', inline: true },
                                { name: 'R8', value: 'No elytra in combat', inline: true },
                                { name: 'R9', value: 'Noobie protection', inline: true },
                                { name: 'R10', value: 'Instant damage arrows', inline: true },
                                { name: 'R11', value: 'No crystals', inline: true },
                                { name: 'R12', value: 'String drop at spawn', inline: true },
                                { name: 'R13', value: 'No trident in combat', inline: true }, // Added as requested
                                { name: 'R14', value: 'Toxicity', inline: true },
                                { name: 'R15', value: 'Excessive swearing—Chat flood', inline: true },
                                { name: 'R16', value: 'Staff decisions must be respected', inline: true },
                                { name: 'R17', value: 'English only—Advertising other servers', inline: false },
                                { name: 'R18', value: 'Ticket spam', inline: true },
                                { name: 'R19', value: 'Incorrect team size', inline: true },
                                { name: 'R20', value: 'Duping/Cheating', inline: true },
                                { name: 'R21', value: 'Arguing about moderation', inline: false },
                            ],
                            footer: 'Reporting players requires evidence; please make sure to have evidence before making tickets. Please don\'t ask staff to check your tickets or ping them.'
                        });

                        await btnInteraction.editReply({ embeds: [basicRulesEmbed] });
                    } 
                    
                    else if (btnInteraction.customId === 'rules_mods') {
                        const bannedModsEmbed = createEmbed({
                            title: '🛡️ Banned Modifications & Client Restrictions',
                            color: 'error',
                            description: 'Any modifications that grant an unfair advantage over vanilla players are strictly prohibited.',
                            fields: [
                                { 
                                    name: '🚫 Hacked Clients & Movement Modifiers', 
                                    value: 'Includes any mods that allow flight, speed hacking, freecam, or fast break.' 
                                },
                                { 
                                    name: '👁️ X-Ray & Vision Enhancers', 
                                    value: 'Mods that let you see through blocks, caves, or player names behind walls.' 
                                },
                                { 
                                    name: '🤖 Automation & Macros', 
                                    value: 'Auto-clicking/burst-clicking buttons, auto-sprint, auto-eating, and automated fishing or farming macros.' 
                                },
                                { 
                                    name: '⚔️ PvP Assistance', 
                                    value: 'Kill-aura, aim assist, reach extenders, auto-totem, and triggerbots.' 
                                },
                                { 
                                    name: '⚠️ Malware & IP Stealers', 
                                    value: 'Mods containing malicious code or scripts that attempt to access your computer’s IP or system information.' 
                                },
                                { 
                                    name: '🗺️ Unapproved Aesthetic Features', 
                                    value: 'Certain minimap mods that indicate the location of nearby players or entities.' 
                                }
                            ],
                            footer: 'Use common sense if it feels unfair, or you will get banned for it.'
                        });

                        await btnInteraction.editReply({ embeds: [bannedModsEmbed] });
                    }
                } catch (err) {
                    logger.error('Error processing rules panel button click:', err);
                }
            });

            await interaction.editReply({ content: `✅ Panel successfully posted to <#${TARGET_CHANNEL_ID}>!` });

        } catch (error) {
            logger.error('Error executing sendrules command:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Command Failed', 'An internal error occurred while deploying the rules window.')]
            }).catch(() => {});
        }
    },
};
