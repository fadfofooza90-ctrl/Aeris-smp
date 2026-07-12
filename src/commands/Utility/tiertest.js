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
                ))
        .addStringOption(option => 
            option.setName('minecraft_name')
                .setDescription('Enter your Minecraft username')
                .setRequired(true)), // Added Minecraft name option
    category: "General",

    async execute(interaction, config, client) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;

            const gamemode = interaction.options.getString('gamemode');
            const mcName = interaction.options.getString('minecraft_name'); // Get the name
            const LOG_CHANNEL_ID = '1525955961171214367';
            const ROLE_TO_PING = '1525928086934130708';

            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            
            if (!logChannel) {
                return await interaction.editReply({ content: '❌ Log channel not found.' });
            }

            // Updated log message to include the MC name
            await logChannel.send({
                content: `<@&${ROLE_TO_PING}>, ${interaction.user} wants to tiertest in **${gamemode}**. Minecraft Name: **${mcName}**`
            });

            await interaction.editReply({ 
                content: `✅ Your request in **${gamemode}** (MC: **${mcName}**) has been sent, you will be tested soon.` 
            });

        } catch (error) {
            await handleInteractionError(error, interaction);
        }
    }
};
