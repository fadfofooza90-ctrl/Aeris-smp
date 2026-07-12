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
                content: `✅ Successfully created private test channel: ${channel}.` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
