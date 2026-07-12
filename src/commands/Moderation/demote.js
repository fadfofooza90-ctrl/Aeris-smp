import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('demote')
        .setDescription('Demotes a user by removing a specific role.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to demote')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the demotion')
                .setRequired(true)),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const target = interaction.options.getMember('target');
            const role = interaction.options.getRole('role');
            const reason = interaction.options.getString('reason');
            const LOG_CHANNEL_ID = '1524514819909353482';

            // Check if member has the role
            if (!target.roles.cache.has(role.id)) {
                return await interaction.editReply({ content: `❌ The user does not have the role **${role.name}**.` });
            }

            // Remove the role
            await target.roles.remove(role, `Demoted by ${interaction.user.tag}: ${reason}`);

            // Log the action
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📉 User Demoted')
                    .setColor('#FFA500')
                    .addFields(
                        { name: '👤 User', value: `${target.user.tag}`, inline: true },
                        { name: '🛡️ Role Removed', value: `${role.name}`, inline: true },
                        { name: '👤 Moderator', value: `${interaction.user.tag}`, inline: true },
                        { name: '📝 Reason', value: reason }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }

            await interaction.editReply({ content: `✅ Successfully demoted **${target.user.username}** by removing the **${role.name}** role.` });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
