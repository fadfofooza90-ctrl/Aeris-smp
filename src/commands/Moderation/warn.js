import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user and manage their warning roles')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The Discord user to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for issuing this warning')
                .setRequired(true)
        ),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const discordUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const guild = interaction.guild;

            // 1. Force fetch ALL guild roles from Discord API directly (fixes cache bugs)
            const allRoles = await guild.roles.fetch();
            const warn1 = allRoles.find(r => r.name === '1 warnings');
            const warn2 = allRoles.find(r => r.name === '2 warnings');
            const warn3 = allRoles.find(r => r.name === '3 warnings');

            if (!warn1 || !warn2 || !warn3) {
                return await interaction.editReply({
                    content: `❌ **Setup Error:** Could not find the warning roles. Ensure you have roles named exactly: \`1 warnings\`, \`2 warnings\`, and \`3 warnings\`.`
                });
            }

            // 2. Force fetch the absolute latest member profile from Discord API
            const member = await guild.members.fetch(discordUser.id).catch(() => null);
            let nextWarnLevel = 1;

            if (member) {
                let currentWarnLevel = 0;
                
                // Directly check presence of role IDs on the member's profile
                if (member.roles.cache.has(warn3.id)) currentWarnLevel = 3;
                else if (member.roles.cache.has(warn2.id)) currentWarnLevel = 2;
                else if (member.roles.cache.has(warn1.id)) currentWarnLevel = 1;

                nextWarnLevel = currentWarnLevel + 1;

                // 3. Move them cleanly up the warning levels
                if (nextWarnLevel === 1) {
                    await member.roles.add(warn1).catch(err => console.error("Error adding role 1:", err));
                } 
                else if (nextWarnLevel === 2) {
                    await member.roles.remove(warn1).catch(() => null);
                    await member.roles.add(warn2).catch(err => console.error("Error adding role 2:", err));
                } 
                else if (nextWarnLevel >= 3) {
                    // Cap at level 3 textually
                    nextWarnLevel = 3; 
                    await member.roles.remove(warn2).catch(() => null);
                    await member.roles.add(warn3).catch(err => console.error("Error adding role 3:", err));

                    // Securely look up the staff channel using your exact channel ID
                    const staffChatChannel = client.channels.cache.get('1513984222346612806');
                    if (staffChatChannel) {
                        await staffChatChannel.send({
                            content: `⚠️ **Attention** @Staff, ${discordUser} has 3 warnings now take action!`
                        }).catch(() => null);
                    }
                }
            }

            // Create the streamlined layout with the green accent color matching image_d585d6.png
            const logEmbed = createEmbed()
                .setColor('#2ECC71')
                .setDescription(
                    `**Warned** ${discordUser}\n\n` +
                    `**Reason:** ${reason}\n` +
                    `**Total Warns:** ${nextWarnLevel}`
                );

            await interaction.editReply({ embeds: [logEmbed] });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
