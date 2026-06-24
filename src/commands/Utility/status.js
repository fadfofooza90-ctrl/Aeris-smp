import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check the live status of the Minecraft server'),
    category: "Information",

    async execute(interaction) {
        // --- CONFIGURATION ---
        // We provide the full IP along with your custom port here directly
        const serverAddress = '185.206.148.153:25631'; 
        // ---------------------

        await interaction.deferReply();

        try {
            // Fetch live data via the alternative stable endpoint
            const response = await fetch(`https://api.mcsrvstat.us/3/${serverAddress}`);
            
            if (!response.ok) {
                return await interaction.editReply({ 
                    content: '❌ Failed to connect to the status API. Try again later.' 
                });
            }

            const data = await response.json();

            // If the API returns offline: true
            if (data.online === false) {
                const offlineEmbed = new EmbedBuilder()
                    .setTitle('🔴 Server Status: Offline')
                    .setDescription(`The server at \`${serverAddress}\` is currently unreachable.`)
                    .setColor('#FF0000')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [offlineEmbed] });
            }

            // Extract the clean MOTD array text lines safely
            const motdLines = data.motd?.clean || ['A Minecraft Server'];
            const cleanMotd = motdLines.join('\n').trim();

            const statusEmbed = new EmbedBuilder()
                .setTitle('🟢 Server Status: Online')
                .setDescription(`\`\`\`\n${cleanMotd || 'Flow SMP Server Instance'}\n\`\`\``)
                .setColor('#00FF00')
                .addFields(
                    { name: '🌐 Server Address', value: `\`${serverAddress}\``, inline: true },
                    { name: '👥 Players Online', value: `\`${data.players?.online ?? 0} / ${data.players?.max ?? 20}\``, inline: true },
                    { name: '🛠️ Version', value: `\`${data.version || 'Java 1.20+'}\``, inline: true }
                )
                .setThumbnail(`https://api.mcsrvstat.us/icon/${serverAddress}`)
                .setFooter({ text: 'Flow SMP Live Monitor' })
                .setTimestamp();

            await interaction.editReply({ embeds: [statusEmbed] });

        } catch (error) {
            console.error('Error fetching Minecraft server status:', error);
            await interaction.editReply({ content: '❌ An error occurred while retrieving the server data.' });
        }
    }
};
