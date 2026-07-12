import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('massrole')
        .setDescription('Assigns a role to multiple users at once.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('users')
                .setDescription('Mention the users separated by spaces')
                .setRequired(true)),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const role = interaction.options.getRole('role');
            const userInput = interaction.options.getString('users');
            
            // Extract IDs from mentions (e.g., <@123456789012345678>)
            const userIds = [...new Set(userInput.match(/\d{17,20}/g))];

            if (!userIds.length) {
                return await interaction.editReply({ content: '❌ No valid user mentions found.' });
            }

            let successCount = 0;
            let errorCount = 0;

            for (const id of userIds) {
                try {
                    const member = await interaction.guild.members.fetch(id);
                    await member.roles.add(role);
                    successCount++;
                } catch (e) {
                    errorCount++;
                }
            }

            await interaction.editReply({ 
                content: `✅ Processed ${userIds.length} users. Successfully assigned **${role.name}** to ${successCount} users. ${errorCount > 0 ? `Failed to add ${errorCount} users.` : ''}` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
