import { SlashCommandBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server')
        .setDMPermission(false),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
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
                                style: 2, // Paragraph style
                                placeholder: 'Type your suggestion for Flow SMP here...',
                                min_length: 10,
                                max_length: 1000,
                                required: true
                            }
                        ]
                    }
                ]
            };

            // Must show the modal pop-up instantly
            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
