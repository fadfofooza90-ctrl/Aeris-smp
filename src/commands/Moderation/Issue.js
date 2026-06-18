import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Issue a moderation action and log it with a visual status')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('minecraft_username')
                .setDescription('The Minecraft IGN of the player')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the punishment (e.g., Permanent, 30 Days, 560 Years)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for issuing this punishment')
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('discord_user')
                .setDescription('The linked Discord user account (optional)')
                .setRequired(false)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const mcUsername = interaction.options.getString('minecraft_username');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason');
            const discordUser = interaction.options.getUser('discord_user');
            const moderator = interaction.user;

            const discordUserValue = discordUser ? `${discordUser}` : 'Not Provided';

            // Safe, non-expiring local attachment conversion
            const imageUrl = 'https://media.discordapp.net/ephemeral-attachments/1515885694852272258/1516152037505761300/Screenshot_2026-06-11_014315.png?ex=6a34e5de&is=6a33945e&hm=c2ddbc179b6f7a95dd78eb44d885b3f815957094d1e063c398345344d5a0c9cd&=&format=webp&quality=lossless&width=1872&height=921';
            const bannerAttachment = new AttachmentBuilder(imageUrl, { name: 'starry_sky.png' });

            const logEmbed = createEmbed()
                .setColor('#2F3136') 
                .setAuthor({ 
                    name: `Issued by ♡`, 
                    iconURL: moderator.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle('Moderation Log: Ban')
                .addFields(
                    { name: 'Discord User', value: discordUserValue, inline: false },
                    { name: 'Minecraft Username', value: mcUsername, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                // Reference the attached image securely 
                .setImage('attachment://starry_sky.png') 
                .setFooter({ 
                    text: `Moderator ID: ${moderator.id}` 
                })
                .setTimestamp();

            // Send the embed alongside the secure file bundle
            await interaction.editReply({ 
                embeds: [logEmbed], 
                files: [bannerAttachment] 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
