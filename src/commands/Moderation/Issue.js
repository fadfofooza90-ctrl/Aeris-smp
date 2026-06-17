import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Log a moderation ban issue')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        // Changed from addUserOption to addStringOption so it's just pure text
        .addStringOption(option =>
            option.setName('discord_name')
                .setDescription('The text name of the banned Discord user (No ping)')
                .setRequired(true) 
        )
        .addStringOption(option =>
            option.setName('minecraft_name')
                .setDescription('The Minecraft username of the player')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('The duration of the ban (e.g., 560 Years)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Issue interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'issue'
                });
                return;
            }

            // 1. Collect all inputs as text strings
            const discordName = interaction.options.getString('discord_name');
            const mcName = interaction.options.getString('minecraft_name');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');

            const moderator = interaction.user;

            // 2. Build the log embed matching image_50bd31.png
            const logEmbed = createEmbed()
                .setColor('#FF0000') 
                .setAuthor({ 
                    name: `Issued by ${moderator.username}`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle('Moderation Log: Ban')
                .addFields(
                    // This will now display exactly what text the moderator typed
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
