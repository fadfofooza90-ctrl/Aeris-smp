import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('demote')
        .setDescription('Demotes a user: removes a high role and adds a lower role.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to demote')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role_to_remove')
                .setDescription('The high role to remove')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role_to_add')
                .setDescription('The lower role to add')
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
            const roleToRemove = interaction.options.getRole('role_to_remove');
            const roleToAdd = interaction.options.getRole('role_to_add');
            const reason = interaction.options.getString('reason');
            const LOG_CHANNEL_ID = '1524514819909353482';

            // 1. Remove the high role
            if (target.roles.cache.has(roleToRemove.id)) {
                await target.roles.remove(roleToRemove, `Demoted by ${interaction.user.tag}: ${reason}`);
            }

            // 2. Add the lower role
            await target.roles.add(roleToAdd, `Demotion assignment: ${reason}`);

            // 3. Log the action
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📉 User Demoted')
                    .setColor('#FFA500')
                    .addFields(
                        { name: '👤 User', value: `${target.user.tag}`, inline: true },
                        { name: '❌ Role Removed', value: `${roleToRemove.name}`, inline: true },
                        { name: '✅ Role Added', value: `${roleToAdd.name}`, inline: true },
                        { name: '👤 Moderator', value: `${interaction.user.tag}`, inline: false },
                        { name: '📝 Reason', value: reason }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }

            await interaction.editReply({ 
                content: `✅ Successfully demoted **${target.user.username}**. Removed **${roleToRemove.name}** and added **${roleToAdd.name}**.` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
