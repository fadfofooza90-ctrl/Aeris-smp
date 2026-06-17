import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Log a moderation mute/timeout issue')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) // Requires Timeout/Mute permission to use
        .addStringOption(option =>
            option.setName('discord_name')
                .setDescription('The text name of the muted Discord user (No ping)')
                .setRequired(true) 
        )
        .addStringOption(option =>
            option.setName('minecraft_name')
                .setDescription('The Minecraft username of the player')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('The duration of the mute (e.g., 1 Hour, 7 Days)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the mute')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Mute interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'mute'
                });
                return;
            }

            // 1. Collect all inputs as text strings
            const discordName = interaction.options.getString('discord_name');
            const mcName = interaction.options.getString('minecraft_name');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');

            const moderator = interaction.user;

            // 2. Build the log embed matching your style layout
            const logEmbed = createEmbed()
                .setColor('#FFA500') // Orange sidebar color for mutes/timeouts to stand out from red bans
                .setAuthor({ 
                    name: `Issued by ${moderator.username}`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle('Moderation Log: Mute/Timeout')
                .addFields(
                    { name: 'Discord User', value: discordName, inline: false },
                    { name: 'Minecraft Username', value: mcName, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setFooter({ 
                    text: `Moderator ID: ${moderator.id}` 
                })
                .setTimestamp();

            // 3. Clean up the defer and output the log
            await interaction.deleteReply();
            await interaction.channel.send({ 
                content: `${moderator}`, // Pings the moderator who ran the command
                embeds: [logEmbed] 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
