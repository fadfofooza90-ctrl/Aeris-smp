import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} from 'discord.js';
import fs from 'fs';
import path from 'path';

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
        .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('View and update active configurations')
        ),
    category: "Moderation",

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        const allowedRoles = ['1513984221587181637', '1513984221587181636'];
        const hasRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasRole) {
            return await interaction.reply({
                content: '❌ **Access Denied:** You do not have the required staff roles to access the AutoMod dashboard.',
                ephemeral: true
            });
        }

        if (subcommand === 'dashboard') {
            const currentConfig = readConfig();

            const generateEmbed = (config) => {
                // Formatting the display beautifully so minutes read nicely as hours if divisible by 60
                const displayTime = config.muteDurationMinutes >= 60 
                    ? `${config.muteDurationMinutes / 60} Hour(s)` 
                    : `${config.muteDurationMinutes} Minute(s)`;

                return new EmbedBuilder()
                    .setTitle('🛡️ AutoMod Configuration Dashboard')
                    .setDescription('Below are the live protection vectors running on the network loop engine.')
                    .setColor('#8B0000')
                    .addFields(
                        { name: '🟢 System Status', value: '> Active & Filtering', inline: true },
                        { name: '📺 Log Target Channel', value: `> <#${config.logChannelId}>`, inline: true },
                        { name: '⏱️ Action Penalty', value: `> \`${displayTime} Timeout\``, inline: false },
                        { name: '📋 Blacklisted Target Strings', value: config.blockedWords.map(word => `• \`${word}\``).join('\n'), inline: false }
                    )
                    .setFooter({ text: 'Flow SMP Security Panel' })
                    .setTimestamp();
            };

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_add_word')
                    .setLabel('➕ Add Words')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('automod_change_duration')
                    .setLabel('⏱️ Change Mute Duration')
                    .setStyle(ButtonStyle.Secondary)
            );

            const response = await interaction.reply({ 
                embeds: [generateEmbed(currentConfig)], 
                components: [buttonsRow] 
            });

            // Keep collector alive for 10 minutes
            const collector = response.createMessageComponentCollector({ time: 600000 });

            collector.on('collect', async i => {
                if (!i.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
                    return await i.reply({ content: '❌ You cannot interact with this panel.', ephemeral: true });
                }

                // --- ADD WORDS BUTTON ---
                if (i.customId === 'automod_add_word') {
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

                    const submitted = await i.awaitModalSubmit({ time: 60000 }).catch(() => null);

                    if (submitted) {
                        const rawInput = submitted.fields.getTextInputValue('words_to_add');
                        const newWords = rawInput.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

                        const freshConfig = readConfig();
                        freshConfig.blockedWords = [...new Set([...freshConfig.blockedWords, ...newWords])];
                        writeConfig(freshConfig);

                        await submitted.reply({ content: `✅ Successfully added: ${newWords.map(w => `\`${w}\``).join(', ')}`, ephemeral: true });
                        await interaction.editReply({ embeds: [generateEmbed(freshConfig)] });
                    }
                }

                // --- CHANGE MUTE DURATION BUTTON (FIXED EXPLICIT INTERACTION) ---
                if (i.customId === 'automod_change_duration') {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('automod_select_duration')
                        .setPlaceholder('Select the new timeout penalty duration...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('1 Hour').setValue('60'),
                            new StringSelectMenuOptionBuilder().setLabel('2 Hours').setValue('120'),
                            new StringSelectMenuOptionBuilder().setLabel('3 Hours').setValue('180'),
                            new StringSelectMenuOptionBuilder().setLabel('4 Hours').setValue('240'),
                            new StringSelectMenuOptionBuilder().setLabel('5 Hours').setValue('300'),
                            new StringSelectMenuOptionBuilder().setLabel('6 Hours').setValue('360'),
                            new StringSelectMenuOptionBuilder().setLabel('7 Hours').setValue('420'),
                            new StringSelectMenuOptionBuilder().setLabel('8 Hours').setValue('480'),
                            new StringSelectMenuOptionBuilder().setLabel('9 Hours').setValue('540')
                        );

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

                    // Use i.reply safely with component type separation tracking
                    const menuMessage = await i.reply({ 
                        content: 'Select a standard duration threshold from the options below:', 
                        components: [selectRow], 
                        ephemeral: true 
                    });

                    const selectCollector = menuMessage.createMessageComponentCollector({ 
                        componentType: ComponentType.StringSelect,
                        time: 60000 
                    });

                    selectCollector.on('collect', async selectInteraction => {
                        if (selectInteraction.customId === 'automod_select_duration') {
                            const selectedMinutes = parseInt(selectInteraction.values[0]);

                            const freshConfig = readConfig();
                            freshConfig.muteDurationMinutes = selectedMinutes;
                            writeConfig(freshConfig);

                            // Safely update the dropdown overlay message
                            await selectInteraction.update({ 
                                content: `✅ Penalty duration successfully updated to **${selectedMinutes / 60} Hour(s)**!`, 
                                components: [] 
                            });
                            
                            // Instantly refresh the main visible dashboard layout embed
                            await interaction.editReply({ embeds: [generateEmbed(freshConfig)] });
                            selectCollector.stop();
                        }
                    });
                }
            });
        }
    }
};
