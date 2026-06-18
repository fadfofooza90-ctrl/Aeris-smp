import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    MessageFlags 
} from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

export default {
    slashOnly: true,
    data: new SlashCommandBuilder()
        .setName('steal')
        .setDescription('Steal an emoji from another server and add it to this server')
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji you want to steal (must be a custom emoji)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Optional custom name for the emoji (defaults to original name)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
        .setDMPermission(false),
    category: 'Utility',

    async execute(interaction) {
        try {
            // Defer the reply since downloading/uploading can take a brief second
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const emojiInput = interaction.options.getString('emoji').trim();
            const customName = interaction.options.getString('name');

            // Regex to parse custom Discord emojis: <:name:id> or <a:name:id>
            const emojiRegex = /<?a?:([^:]+):(\d{17,19})>?/;
            const match = emojiInput.match(emojiRegex);

            if (!match) {
                return await interaction.editReply({
                    embeds: [errorEmbed('Invalid Emoji', 'Please provide a valid custom emoji from another server. Default system emojis cannot be stolen.')]
                });
            }

            const originalName = match[1];
            const emojiId = match[2];
            const isAnimated = emojiInput.includes('<a:');
            
            // Construct the direct image URL for the emoji
            const extension = isAnimated ? 'gif' : 'png';
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
            
            // Determine final name (fallback to original name if customName isn't provided)
            const finalName = customName 
                ? customName.replace(/[^a-zA-Z0-9_]/g, '') // Sanitize name for Discord restrictions
                : originalName;

            if (finalName.length < 2 || finalName.length > 32) {
                return await interaction.editReply({
                    embeds: [errorEmbed('Invalid Name', 'Emoji names must be between 2 and 32 alphanumeric characters.')]
                });
            }

            // Create the emoji in the current guild
            const createdEmoji = await interaction.guild.emojis.create({
                attachment: emojiUrl,
                name: finalName,
                reason: `Stolen by ${interaction.user.tag} using /steal`
            });

            await interaction.editReply({
                embeds: [successEmbed(
                    'Emoji Successfully Stolen! 🎉',
                    `Added ${createdEmoji} as \`:${finalName}:\` to this server.`
                )]
            });

        } catch (error) {
            logger.error('Error executing steal command:', error);

            // Handle common Discord API errors gracefully
            let errorMessage = 'An error occurred while attempting to steal the emoji.';
            if (error.code === 30008) {
                errorMessage = 'This server has reached its maximum limit for custom emojis!';
            } else if (error.code === 50013) {
                errorMessage = 'The bot lacks the **Manage Expressions** (Manage Emojis and Stickers) permission to perform this action.';
            }

            await interaction.editReply({
                embeds: [errorEmbed('Command Failed', errorMessage)]
            }).catch(() => {});
        }
    },
};
