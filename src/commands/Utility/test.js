import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
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
            const categoryId = '1525924122620854322'; // Category ID added here

            // Create the private channel
            const channel = await interaction.guild.channels.create({
                name: `test-${target.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryId, // This line places the channel in the category
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, 
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: target.id, 
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: role1, 
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: role2, 
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ],
            });

            // Send a ping to the user who ran the command
            await channel.send(`${interaction.user}, the test channel for ${target} has been created.`);

            await interaction.editReply({ 
                content: `✅ Successfully created private test channel: ${channel} in the specified category.` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
