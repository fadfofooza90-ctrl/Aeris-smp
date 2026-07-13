import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tieradd')
        .setDescription('Log a tier test and assign the tier role')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option => option.setName('user').setDescription('The Discord user').setRequired(true))
        .addStringOption(option => option.setName('minecraft_user').setDescription('Minecraft username').setRequired(true))
        .addStringOption(option => option.setName('gamemode').setDescription('Gamemode').setRequired(true)
            .addChoices(
                { name: 'Diasmp', value: 'Diasmp' },
                { name: 'Cart', value: 'Cart' }
            ))
        .addRoleOption(option => option.setName('tier_role').setDescription('Select the tier role to assign').setRequired(true)),

    async execute(interaction, config, client) {
        const targetUser = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(targetUser.id);
        const mcUser = interaction.options.getString('minecraft_user');
        const gamemode = interaction.options.getString('gamemode');
        const tierRole = interaction.options.getRole('tier_role');
        const logChannelId = '1526185454431633469';

        try {
            // 1. Add the role to the user
            await member.roles.add(tierRole);

            // 2. Prepare the embed
            const logEmbed = new EmbedBuilder()
                .setTitle('⚔️ Tier Test Completed')
                .setColor('#2ECC71')
                .addFields(
                    { name: 'Discord User', value: `${targetUser}`, inline: true },
                    { name: 'Minecraft User', value: mcUser, inline: true },
                    { name: 'Gamemode', value: gamemode, inline: true },
                    { name: 'Tier Assigned', value: `${tierRole}`, inline: true }
                )
                .setTimestamp();

            // 3. Log to channel
            const channel = await client.channels.fetch(logChannelId).catch(() => null);
            if (channel) {
                await channel.send({ embeds: [logEmbed] });
                await interaction.reply({ content: `✅ Successfully added ${tierRole.name} to ${targetUser.username}!`, ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Logged the tier, but could not find the logging channel.', ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to assign the role. Check my permissions!', ephemeral: true });
        }
    }
};
