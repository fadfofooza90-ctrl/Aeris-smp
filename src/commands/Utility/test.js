import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, OverwriteType } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Creates a private testing channel for a user.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to test')
                .setRequired(true)),
    category: "Moderation",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const target = interaction.options.getMember('target');
            const role1 = '1525928086934130708';
            const role2 = '1524503770774372414';

            // Create the private channel
            const channel = await interaction.guild.channels.create({
                name: `test-${target.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // Hide from @everyone
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: target.id, // Allow target user
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: role1, // Allow Role 1
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: role2, // Allow Role 2
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ],
            });

            await interaction.editReply({ 
                content: `✅ Successfully created private test channel: ${channel}.` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
