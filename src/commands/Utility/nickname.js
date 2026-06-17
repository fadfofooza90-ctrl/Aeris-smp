import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Changes the nickname of a server member')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames) // Limits command to staff with permission
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member you want to @ tag')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('new_nickname')
                .setDescription('The new nickname (e.g., Viper_test)')
                .setRequired(true)
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Nickname interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'nickname'
                });
                return;
            }

            // 1. Fetch the tagged member and the text input
            const targetUser = interaction.options.getMember('user');
            const newNickname = interaction.options.getString('new_nickname');

            // 2. Role Hierarchy Check: Ensure the bot actually has authority over this user
            if (!targetUser.manageable) {
                return await interaction.editReply({ 
                    content: `❌ I cannot change the nickname of **${targetUser.user.username}**. Their roles are higher than mine or they own the server.` 
                });
            }

            // 3. Update the nickname on Discord
            await targetUser.setNickname(newNickname);

            // 4. Send confirmation message
            await interaction.editReply({ 
                content: `✅ Successfully changed **${targetUser.user.username}**'s nickname to **${newNickname}**!` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
