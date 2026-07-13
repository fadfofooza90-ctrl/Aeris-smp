import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

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

        await interaction.reply({ content: '@here A TierTest Queue Has Been Opened!', embeds: [embed], components: [row] });

        const adminChannel = await interaction.client.channels.fetch(adminChannelId).catch(() => null);
        if (adminChannel) {
            const adminEmbed = new EmbedBuilder()
                .setTitle('⚙️ Admin Queue Controls')
                .setDescription('Use the buttons below to manage the queue.')
                .setColor('#FF0000');

            const adminRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('admin_ticket').setLabel('Make Ticket (User #1)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('admin_remove_trigger').setLabel('Remove User').setStyle(ButtonStyle.Danger)
            );
            
            // Add an empty select menu so it exists to be edited later
            const selectRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('admin_remove_select').setPlaceholder('Select user to remove').addOptions([{ label: 'None', value: 'none' }])
            );

            await adminChannel.send({ embeds: [adminEmbed], components: [adminRow, selectRow] });
        }
    }
};
