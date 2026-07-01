import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unipban')
        .setDescription('Removes a network/IP ban from a user.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The ID of the user to unban')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const userId = interaction.options.getString('user_id');
            const guild = interaction.guild;

            // Check if the user is actually banned
            const ban = await guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                return await interaction.editReply({
                    content: `❌ The user with ID \`${userId}\` is not currently banned.`
                });
            }

            // Remove the ban
            await guild.bans.remove(userId, `Un-IP Banned by ${interaction.user.username}`);

            // Confirmation message
            await interaction.editReply({
                content: `✅ **Successfully removed IP ban** for user ID \`${userId}\`.\n\nThey may now rejoin the server if they have an invite.`
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
