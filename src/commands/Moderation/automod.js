import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import fs from 'fs';
import path from 'path';

// Helper paths to reach our local json store safely
const configPath = path.resolve('./automodConfig.json');

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
        return { logChannelId: "1513984222346612805", muteDurationMinutes: 60, blockedWords: ["nigger", "kys", "killyourself", "bitch"] };
    }
}

function writeConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage the network AutoMod infrastructure')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('View and update active configurations')
        ),
    category: "Moderation",

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'dashboard') {
            const currentConfig = readConfig();

            const dashboardEmbed = new EmbedBuilder()
                .setTitle('🛡️ AutoMod Configuration Dashboard')
                .setDescription('Below are the live protection vectors running on the network loop engine.')
                .setColor('#8B0000')
                .addFields(
                    { name: '🟢 System Status', value: '> Active & Filtering', inline: true },
                    { name: '📺 Log Target Channel', value: `> <#${currentConfig.logChannelId}>`, inline: true },
                    { name: '⏱️ Action Penalty', value: `> \`${currentConfig.muteDurationMinutes} Minute Timeout\``, inline: false },
                    { name: '📋 Blacklisted Target Strings', value: currentConfig.blockedWords.map(word => `• \`${word}\``).join('\n'), inline: false }
                )
                .setFooter({ text: 'Flow SMP Security Panel' })
                .setTimestamp();

            // Create a button component underneath our layout
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_add_word')
                    .setLabel('➕ Add Blacklisted Words')
                    .setStyle(ButtonStyle.Danger)
            );

            const response = await interaction.reply({ embeds: [dashboardEmbed], components: [row] });

            // Create a collector right on this message to watch for button presses
            const collector = response.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', async i => {
                if (i.customId === 'automod_add_word') {
                    // Open a structural popup input modal overlay form
                    const modal = new ModalBuilder()
                        .setCustomId('automod_modal_form')
                        .setTitle('Add Slurs to Filters');

                    const wordInput = new TextInputBuilder()
                        .setCustomId('words_to_add')
                        .setLabel("Enter words (separate multiple with commas)")
                        .setPlaceholder("slur1, slur2, toxicphrase")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(wordInput));
                    await i.showModal(modal);

                    // Wait for user to save form data
                    const submitted = await i.awaitModalSubmit({ time: 60000 }).catch(() => null);

                    if (submitted) {
                        const rawInput = submitted.fields.getTextInputValue('words_to_add');
                        // Split inputs cleanly by comma and filter out whitespace garbage
                        const newWords = rawInput.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

                        const freshConfig = readConfig();
                        // Merge lists while removing any duplicate submissions
                        freshConfig.blockedWords = [...new Set([...freshConfig.blockedWords, ...newWords])];
                        writeConfig(freshConfig);

                        // Generate fresh UI updates to show additions immediately
                        const updatedEmbed = new EmbedBuilder()
                            .setTitle('🛡️ AutoMod Configuration Dashboard')
                            .setDescription('Below are the live protection vectors running on the network loop engine.')
                            .setColor('#8B0000')
                            .addFields(
                                { name: '🟢 System Status', value: '> Active & Filtering', inline: true },
                                { name: '📺 Log Target Channel', value: `> <#${freshConfig.logChannelId}>`, inline: true },
                                { name: '⏱️ Action Penalty', value: `> \`${freshConfig.muteDurationMinutes} Minute Timeout\``, inline: false },
                                { name: '📋 Blacklisted Target Strings', value: freshConfig.blockedWords.map(word => `• \`${word}\``).join('\n'), inline: false }
                            )
                            .setFooter({ text: 'Flow SMP Security Panel • Updated Live' })
                            .setTimestamp();

                        await submitted.reply({ content: `✅ Successfully added: ${newWords.map(w => `\`${w}\``).join(', ')}`, ephemeral: true });
                        await interaction.editReply({ embeds: [updatedEmbed] });
                    }
                }
            });
        }
    }
};
