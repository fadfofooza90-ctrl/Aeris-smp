import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('View which roles have access to your moderation commands')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Restricted to Administrators only
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const guild = interaction.guild;

            // 1. Fetch all commands registered to this server to read their settings
            const guildCommands = await guild.commands.fetch();
            const issueCommand = guildCommands.find(cmd => cmd.name === 'issue');

            let permittedRolesList = [];

            if (issueCommand) {
                try {
                    // Fetch the live permission overrides for the /issue command
                    const permissions = await guild.commands.permissions.fetch({ command: issueCommand.id });
                    
                    // Filter down to roles that are explicitly allowed (true)
                    const allowedRoles = permissions.filter(perm => perm.type === 1 && perm.permission === true);
                    
                    for (const perm of allowedRoles) {
                        permittedRolesList.push(`<@&${perm.id}>`);
                    }
                } catch (e) {
                    // If no explicit overrides exist yet, it defaults back to anyone with the "Ban Members" permission
                    permittedRolesList = [];
                }
            }

            // Fallback description text if no special overrides are configured in Integration settings yet
            if (permittedRolesList.length === 0) {
                permittedRolesList.push(
                    `*No custom overrides configured yet.*\n` +
                    `Currently, anyone holding a role with the **Ban Members** permission can view and run \`/issue\`.`
                );
            } else {
                permittedRolesList = permittedRolesList.map(role => `> ${role}`);
            }

            // 2. Render the System Dashboard Card
            const dashboardEmbed = createEmbed()
                .setColor('#2ECC71') // Smooth green matching your server style
                .setTitle('⚙️ Flow SMP | Management Dashboard')
                .setDescription(
                    `### 🛡️ Active Moderation Access\n` +
                    `The following roles are explicitly granted access to the \`/issue\` command suite (ban, timeout, warn):\n\n` +
                    `${permittedRolesList.join('\n')}\n\n` +
                    `--- \n` +
                    `*💡 **Tip:** To add or remove roles from this dashboard, navigate to **Server Settings ➔ Apps ➔ Integrations ➔ ${client.user.username}** inside your Discord client.*`
                )
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [dashboardEmbed] });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
