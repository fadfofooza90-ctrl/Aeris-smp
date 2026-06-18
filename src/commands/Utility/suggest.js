if (interaction.isModalSubmit()) {
    if (interaction.customId === 'suggestion_modal') {
        try {
            // Instantly acknowledge the submission so the user doesn't see "Interaction Failed"
            await interaction.deferReply({ ephemeral: true });

            // FIX: Use interaction.fields instead of interaction.options
            const suggestionText = interaction.fields.getTextInputValue('suggestion_text');
            const user = interaction.user;
            const guild = interaction.guild;

            // Target DM User ID
            const targetUserId = '1008719737825534043';
            const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);

            if (targetUser) {
                try {
                    // Try to use your custom project embed structure
                    const { createEmbed } = await import('../../utils/embeds.js');
                    const suggestionEmbed = createEmbed()
                        .setColor('#2ECC71')
                        .setTitle('📩 New Server Suggestion')
                        .setDescription(`\`\`\`\n${suggestionText}\n\`\`\``)
                        .addFields(
                            { name: 'Submitted By', value: `${user} (${user.username})`, inline: true },
                            { name: 'Server', value: `${guild.name}`, inline: true }
                        )
                        .setTimestamp();

                    await targetUser.send({ embeds: [suggestionEmbed] }).catch(() => null);
                } catch (embedError) {
                    // Fallback: If your path to embeds.js fails, send a standard raw embed object so it doesn't crash
                    await targetUser.send({
                        embeds: [{
                            color: 0x2ECC71,
                            title: '📩 New Server Suggestion',
                            description: `\`\`\`\n${suggestionText}\n\`\`\``,
                            fields: [
                                { name: 'Submitted By', value: `${user} (${user.username})`, inline: true },
                                { name: 'Server', value: `${guild.name}`, inline: true }
                            ],
                            timestamp: new Date()
                        }]
                    }).catch(() => null);
                }
            }

            // Confirm cleanly to the member that it went through
            await interaction.editReply({
                content: '✅ Thank you! Your suggestion has been successfully sent to the server administration team.'
            });

        } catch (error) {
            console.error('Error handling modal submission:', error);
            if (interaction.deferred) {
                await interaction.editReply({ content: '❌ An error occurred while routing your suggestion.' }).catch(() => null);
            }
        }
    }
}
