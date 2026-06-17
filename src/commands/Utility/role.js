import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage server member roles')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Requires Manage Roles permission to use
        // This sets up the "add" subcommand -> /role add
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Give a role to a server member')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The member you want to give the role to')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role you want to add')
                        .setRequired(true)
                )
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Role interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'role'
                });
                return;
            }

            // Check which subcommand was used (in this case, 'add')
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const targetMember = interaction.options.getMember('user');
                const role = interaction.options.getRole('role');
                const botMember = interaction.guild.members.me;

                // 1. Safety Check: Is the role higher than the bot's highest role?
                if (role.position >= botMember.roles.highest.position) {
                    return await interaction.editReply({
                        content: `❌ I cannot add the role **${role.name}** because it is ranked higher than, or equal to, my own highest role in the server settings!`
                    });
                }

                // 2. Safety Check: Is the role manageable (like an integration role or @everyone)?
                if (!role.editable) {
                    return await interaction.editReply({
                        content: `❌ The role **${role.name}** is managed by an external integration or cannot be modified by bots.`
                    });
                }

                // 3. Check if the user already has the role
                if (targetMember.roles.cache.has(role.id)) {
                    return await interaction.editReply({
                        content: `⚠️ **${targetMember.user.username}** already has the role **${role.name}**.`
                    });
                }

                // 4. Add the role to the member
                await targetMember.roles.add(role);

                // 5. Send a clean confirmation message using editReply
                await interaction.editReply({
                    content: `✅ Successfully added the role **${role.name}** to **${targetMember.user.username}**!`
                });
            }

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
