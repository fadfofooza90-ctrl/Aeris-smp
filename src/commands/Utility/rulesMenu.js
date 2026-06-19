import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';

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

            const hubEmbed = createEmbed({
                title: '📜 Server Information & Guidelines',
                description: 'Welcome to Flow SMP! Please select one of the buttons below to review our server rules, ban durations, and client restrictions.',
                color: 'primary',
                footer: 'Make sure to follow all guidelines to keep our community safe and fair.'
            });

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

            await targetChannel.send({
                embeds: [hubEmbed],
                components: [buttonRow]
            });

            await interaction.editReply({ content: `✅ Panel successfully posted to <#${TARGET_CHANNEL_ID}>!` });

        } catch (error) {
            console.error('Error executing sendrules command:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Command Failed', 'An internal error occurred while deploying the rules window.')]
            }).catch(() => {});
        }
    },
};
