import { SlashCommandBuilder } from 'discord.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server')
        .setDMPermission(false),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // We use the raw JSON modal structure directly inside the execute command
            // so it never interferes with the SlashCommandBuilder registration.
            const modal = {
                title: 'Submit a Suggestion',
                custom_id: 'suggestion_modal',
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 4, // Text Input
                                custom_id: 'suggestion_text',
                                label: 'What is your suggestion?',
                                style: 2, // Paragraph layout
                                placeholder: 'Type your suggestion for Flow SMP here...',
                                min_length: 10,
                                max_length: 1000,
                                required: true
                            }
                        ]
                    }
                ]
            };

            // This must be shown instantly to the user
            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
