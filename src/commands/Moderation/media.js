const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('media')
        .setDescription('Setup Media Team Application'),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Only administrators can use this command.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Infuse-SMP | Media Team Application')
            .setDescription('Are you an active creator publishing TikTok videos on our network?')
            .addFields({
                name: 'Core Verification Metrics Required:',
                value: '• Your channel must have at least **10 videos** published.\n• Your videos must consistently achieve **200+ views** each.'
            })
            .setColor(0x00FF00);

        const button = new ButtonBuilder()
            .setCustomId('media_apply_button')
            .setLabel('Check Requirements & Apply')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
