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
    StringSelectMenuOptionBuilder
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

            // Function to generate the fresh UI layout
            const generateEmbed = (config) => {
                return new EmbedBuilder()
                    .setTitle('🛡️ AutoMod Configuration Dashboard')
                    .setDescription('Below are the live protection vectors running on the network loop engine.')
                    .setColor('#8B0000')
                    .addFields(
                        { name: '🟢 System Status', value: '> Active & Filtering', inline: true },
                        { name: '📺 Log Target Channel', value: `> <#${config.logChannelId}>`, inline: true },
                        { name: '⏱️ Action Penalty', value: `> \`${config.muteDurationMinutes} Minute(s) Timeout\``, inline: false },
                        { name: '📋 Blacklisted Target Strings', value: config.blockedWords.map(word => `• \`${word}\``).join('\n'), inline: false }
                    )
                    .setFooter({ text: 'Flow SMP Security Panel' })
                    .setTimestamp();
            };

            // Two buttons side-by-side in a control row
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

            const collector = response.createMessageComponentCollector({ time: 300000 }); // Active for 5 minutes

            collector.on('collect', async i => {
                if (!i.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
                    return await i.reply({ content: '❌ You cannot interact with this panel.', ephemeral: true });
                }

                // --- OPTION A: ADD BLACKLISTED WORDS BUTTON ---
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

                // --- OPTION B: CHANGE MUTE DURATION BUTTON ---
                if (i.customId === 'automod_change_duration') {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('automod_select_duration')
                        .setPlaceholder('Select the new timeout penalty duration...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('30 Minutes').setValue('30').setDescription('Sets mute duration to 30m'),
                            new StringSelectMenuOptionBuilder().setLabel('1 Hour').setValue('60').setDescription('Sets mute duration to 1h (Default)'),
                            new StringSelectMenuOptionBuilder().setLabel('2 Hours').setValue('120').setDescription('Sets mute duration to 2h'),
                            new StringSelectMenuOptionBuilder().setLabel('3 Hours').setValue('180').setDescription('Sets mute duration to 3h')
                        );

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

                    // Send the select menu row as an ephemeral reply so it doesn't crowd chat
                    const menuMessage = await i.reply({ 
                        content: 'Select a standard duration threshold from the options below:', 
                        components: [selectRow], 
                        ephemeral: true 
                    });

                    // Collect the choice from the select menu
                    const selectCollector = menuMessage.createMessageComponentCollector({ time: 30000 });

                    selectCollector.on('collect', async selectInteraction => {
                        if (selectInteraction.customId === 'automod_select_duration') {
                            const selectedMinutes = parseInt(selectInteraction.values[0]);

                            const freshConfig = readConfig();
                            freshConfig.muteDurationMinutes = selectedMinutes;
                            writeConfig(freshConfig);

                            // Delete or clear out the menu option interface cleanly
                            await selectInteraction.update({ content: `✅ Penalty duration successfully updated to **${selectedMinutes} minutes**!`, components: [] });
                            
                            // Re-render the primary root dashboard embed interface live
                            await interaction.editReply({ embeds: [generateEmbed(freshConfig)] });
                        }
                    });
                }
            });
        }
    }
};
