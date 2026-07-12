import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tiertest')
        .setDescription('Request a tier test for a specific gamemode.')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('gamemode')
                .setDescription('Select the gamemode for the tier test')
                .setRequired(true)
                .addChoices(
                    { name: 'Cart', value: 'Cart' },
                    { name: 'Diasmp', value: 'Diasmp' }
                )),
    category: "General",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const gamemode = interaction.options.getString('gamemode');
            const LOG_CHANNEL_ID = '1525955961171214367';
            const ROLE_TO_PING = '1525928086934130708';

            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            
            if (!logChannel) {
                return await interaction.editReply({ content: '❌ Log channel not found.' });
            }

            // Send the message to the specified channel
            await logChannel.send({
                content: `<@&${ROLE_TO_PING}>, ${interaction.user} wants to tiertest in **${gamemode}**.`
            });

            await interaction.editReply({ 
                content: `✅ Your request for a **${gamemode}** tier test has been sent 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
