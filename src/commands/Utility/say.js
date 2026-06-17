import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Makes the bot repeat your message')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want the bot to say')
                .setRequired(true)
        ),
    category: "Utility",

    async execute(interaction, config, client) {
        try {
            // Safely defer the interaction response just like your firstmsg.js does
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Say interaction defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'say'
                });
                return;
            }

            // 1. Get the message the user typed in the option
            const userMessage = interaction.options.getString('message');

            // 2. Delete the initial "thinking..." defer message so only the bot's response shows up
            await interaction.deleteReply();

            // 3. Send the custom message into the channel
            await interaction.channel.send(userMessage);

        } catch (error) {
            // Fallback to your custom error handler if something goes wrong
            await handleInteractionError(error, interaction);
        }
    }
};
