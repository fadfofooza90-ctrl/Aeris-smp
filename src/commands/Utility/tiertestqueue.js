import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tiertestqueue')
        .setDescription('Start a TierTest queue'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ TierTest Queue')
            .setDescription('The queue updates live.\nUse the buttons below to join or leave the queue.\n\n**Queue:**\n(No one is in the queue yet.)')
            .setColor('#FFA500')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                // IDs updated to match the handler in interactionCreate.js
                new ButtonBuilder()
                    .setCustomId('queue_join') 
                    .setLabel('Join Queue')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('queue_leave')
                    .setLabel('Leave Queue')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({ 
            content: '@here A TierTest Queue Has Been Opened!', 
            embeds: [embed], 
            components: [row] 
        });
    }
};
