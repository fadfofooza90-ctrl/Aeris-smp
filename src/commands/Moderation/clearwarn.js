import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clearwarn')
        .setDescription('Clear all warning roles from a user')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose warnings you want to clear')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const discordUser = interaction.options.getUser('user');
            const guild = interaction.guild;

            // 1. Force fetch ALL guild roles from Discord API directly
            const allRoles = await guild.roles.fetch();
            const warn1 = allRoles.find(r => r.name === '1 warnings');
            const warn2 = allRoles.find(r => r.name === '2 warnings');
            const warn3 = allRoles.find(r => r.name === '3 warnings');

            // 2. Fetch the target member profile
            const member = await guild.members.fetch(discordUser.id).catch(() => null);

            if (member) {
                // Strip away any warning roles they currently have assigned
                if (warn1 && member.roles.cache.has(warn1.id)) await member.roles.remove(warn1).catch(() => null);
                if (warn2 && member.roles.cache.has(warn2.id)) await member.roles.remove(warn2).catch(() => null);
                if (warn3 && member.roles.cache.has(warn3.id)) await member.roles.remove(warn3.id).catch(() => null);
            }

            // 3. Render a clean log matching your server style layout
            const logEmbed = createEmbed()
                .setColor('#2ECC71') // Green accent edge
                .setDescription(
                    `**Cleared Warnings** for ${discordUser}\n\n` +
                    `**Total Warns:** 0`
                );

            await interaction.editReply({ embeds: [logEmbed] });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
