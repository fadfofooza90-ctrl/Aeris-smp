import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tiertestqueue')
        .setDescription('Start a TierTest queue'),

    async execute(interaction) {
        const adminChannelId = '1526299637235978240';
        
        const embed = new EmbedBuilder()
            .setTitle('⚔️ TierTest Queue')
            .setDescription('The queue updates live.\nUse the buttons below to join or leave the queue.\n\n**Queue:**\n(No one is in the queue yet.)')
            .setColor('#FFA500')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('queue_join').setLabel('Join Queue').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('queue_leave').setLabel('Leave Queue').setStyle(ButtonStyle.Danger)
        );

        // 1. Send public message and fetch it to get its IDs
        const publicMsg = await interaction.reply({ 
            content: '@here A TierTest Queue Has Been Opened!', 
            embeds: [embed], 
            components: [row],
            fetchReply: true 
        });

        // 2. Send Admin Panel
        const adminChannel = await interaction.client.channels.fetch(adminChannelId).catch(() => null);
        if (adminChannel) {
            const adminEmbed = new EmbedBuilder()
                .setTitle('⚙️ Admin Queue Controls')
                .setDescription('Use the buttons below to manage the queue.')
                .setColor('#FF0000');

            // The IDs are now hidden inside the customId of the buttons
            const adminRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`admin_ticket:${publicMsg.channelId}:${publicMsg.id}`)
                    .setLabel('Make Ticket (User #1)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`admin_remove:${publicMsg.channelId}:${publicMsg.id}`)
                    .setLabel('Remove User')
                    .setStyle(ButtonStyle.Danger)
            );

            await adminChannel.send({ 
                content: '⚙️ **Queue Admin Panel**', 
                embeds: [adminEmbed], 
                components: [adminRow] 
            });
        }
    }
};
