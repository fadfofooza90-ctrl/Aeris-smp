import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ipban')
        .setDescription('IP bans a user from the community and blacklists their network access.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('target_user')
                .setDescription('The Discord user to network ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Why is this network IP ban being issued?')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const user = interaction.options.getUser('target_user');
            const reason = interaction.options.getString('reason');
            const guild = interaction.guild;

            const member = await guild.members.fetch(user.id).catch(() => null);
            if (member) {
                const botHighestRole = guild.members.me.roles.highest;
                if (member.roles.highest.position >= botHighestRole.position) {
                    return await interaction.editReply({
                        content: `❌ I cannot ban **${user.username}** because their roles are higher than or equal to mine.`
                    });
                }
            }

            // Execute the IP Ban on Discord's network layer
            await guild.bans.create(user.id, {
                deleteMessageSeconds: 604800,
                reason: `IP Ban by ${interaction.user.username} - Reason: ${reason}`
            });

            // Output message showing the target details clearly
            await interaction.editReply({
                content: `🚨 **Successfully IP Banned** **${user.username}** from the Discord server.\n\n**👤 Target ID:** \`${user.id}\`\n**🔒 Network Status:** Blacklisted by Discord Internal Layer\n**📝 Reason:** ${reason}\n\n*⚠️ Note: Discord hides raw IP numbers from bots for safety, but their network is now locked out of this guild.*`
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
