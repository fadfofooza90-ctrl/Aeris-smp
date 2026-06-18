import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('View system access lists and manage the bot runtime')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Restricted to Admins only
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const guild = interaction.guild;

            // 1. Fetch active command permissions for /issue
            const guildCommands = await guild.commands.fetch();
            const issueCommand = guildCommands.find(cmd => cmd.name === 'issue');

            let permittedRolesList = [];

            if (issueCommand) {
                try {
                    const permissions = await guild.commands.permissions.fetch({ command: issueCommand.id });
                    const allowedRoles = permissions.filter(perm => perm.type === 1 && perm.permission === true);
                    
                    for (const perm of allowedRoles) {
                        permittedRolesList.push(`<@&${perm.id}>`);
                    }
                } catch (e) {
                    permittedRolesList = [];
                }
            }

            if (permittedRolesList.length === 0) {
                permittedRolesList.push(
                    `*No custom overrides configured yet.*\n` +
                    `Currently, anyone holding a role with the **Ban Members** permission can run \`/issue\`.`
                );
            } else {
                permittedRolesList = permittedRolesList.map(role => `> ${role}`);
            }

            // 2. Build the Dashboard Embed Card
            const dashboardEmbed = createEmbed()
                .setColor('#2ECC71')
                .setTitle('⚙️ Flow SMP | Management Dashboard')
                .setDescription(
                    `### 🛡️ Active Moderation Access\n` +
                    `The following roles are explicitly granted access to the \`/issue\` command suite:\n\n` +
                    `${permittedRolesList.join('\n')}\n\n` +
                    `### 🚀 System Control\n` +
                    `Click the button below to initiate a clean software restart. Railway will automatically bring the process back online immediately.`
                )
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            // 3. Create the Restart Interactive Button
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('admin_restart_bot')
                    .setLabel('Restart Bot Processes')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔄')
            );

            await interaction.editReply({ embeds: [dashboardEmbed], components: [row] });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
