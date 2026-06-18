if (interaction.isModalSubmit()) {
    if (interaction.customId === 'suggestion_modal') {
        try {
            // 1. Instantly acknowledge the submission so the modal doesn't show an error
            await interaction.deferReply({ ephemeral: true });

            // 2. Safely extract the input field value
            const suggestionText = interaction.fields.getTextInputValue('suggestion_text');
            const user = interaction.user;
            const guild = interaction.guild;

            // 3. Look up your personal account (Target DM User ID)
            const targetUserId = '1008719737825534043';
            const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);

            if (targetUser) {
                // 4. Send the message directly using a native embed object (no imports required!)
                await targetUser.send({
                    embeds: [{
                        color: 0x2ECC71, // Smooth green edge line
                        title: '📩 New Server Suggestion',
                        description: `\`\`\`\n${suggestionText}\n\`\`\``,
                        fields: [
                            { name: 'Submitted By', value: `${user} (${user.username})`, inline: true },
                            { name: 'Server', value: `${guild.name}`, inline: true }
                        ],
                        timestamp: new Date()
                    }]
                }).catch(err => console.error("Could not send DM to admin:", err.message));
            }

            // 5. Respond back to the member inside the server chat invisibly
            await interaction.editReply({
                content: '✅ Thank you! Your suggestion has been successfully sent to the server administration team.'
            });

        } catch (error) {
            console.error('Error handling modal submission:', error);
            // Secure fallback to stop the loading wheel if it gets caught late
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ An error occurred while processing your submission.' });
                } else {
                    await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
                }
            } catch (replyError) {
                // Ignore secondary reply errors
            }
        }
    }
}
