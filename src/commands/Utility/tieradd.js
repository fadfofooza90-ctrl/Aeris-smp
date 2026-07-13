import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tieradd')
        .setDescription('Log a new tier test result')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Adjust permissions as needed
        .addUserOption(option => option.setName('user').setDescription('The Discord user').setRequired(true))
        .addStringOption(option => option.setName('minecraft_user').setDescription('The player\'s Minecraft username').setRequired(true))
        .addStringOption(option => option.setName('gamemode').setDescription('Gamemode').setRequired(true)
            .addChoices(
                { name: 'Diasmp', value: 'Diasmp' },
                { name: 'Cart', value: 'Cart' }
            ))
        .addStringOption(option => option.setName('tier').setDescription('The achieved Tier').setRequired(true)),

    async execute(interaction, config, client) {
        const targetUser = interaction.options.getUser('user');
        const mcUser = interaction.options.getString('minecraft_user');
        const gamemode = interaction.options.getString('gamemode');
        const tier = interaction.options.getString('tier');
        const logChannelId = '1526185454431633469';

        const logEmbed = new EmbedBuilder()
            .setTitle('⚔️ New Tier Test Added')
            .setColor('#FFA500')
            .addFields(
                { name: 'Discord User', value: `${targetUser}`, inline: true },
                { name: 'Minecraft User', value: mcUser, inline: true },
                { name: 'Gamemode', value: gamemode, inline: true },
                { name: 'Tier', value: tier, inline: true }
            )
            .setTimestamp();

        const channel = await client.channels.fetch(logChannelId).catch(() => null);
        
        if (channel) {
            await channel.send({ embeds: [logEmbed] });
            await interaction.reply({ content: `✅ Tier successfully logged for ${targetUser.username}!`, ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Could not find the logging channel.', ephemeral: true });
        }
    }
};
