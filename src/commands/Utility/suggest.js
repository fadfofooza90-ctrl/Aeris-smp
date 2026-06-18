import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server')
        .setDMPermission(false), // Members must use it inside the server
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // 1. Create the pop-up modal form
            const modal = new ModalBuilder()
                .setCustomId('suggestion_modal')
                .setTitle('Submit a Suggestion');

            // 2. Create the text input field for the suggestion
            const suggestionInput = new TextInputBuilder()
                .setCustomId('suggestion_text')
                .setLabel('What is your suggestion?')
                .setStyle(TextInputStyle.Paragraph) // Large text area box
                .setPlaceholder('Type your suggestion for Flow SMP here...')
                .setMinLength(10)
                .setMaxLength(1000)
                .setRequired(true);

            // Modals require components to be wrapped inside an Action Row
            const firstActionRow = new ActionRowBuilder().addComponents(suggestionInput);
            modal.addComponents(firstActionRow);

            // 3. Show the pop-up form directly to the member
            // Note: We do NOT defer the reply here because showing a modal must happen instantly!
            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
