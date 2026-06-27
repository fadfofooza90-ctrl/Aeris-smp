import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; 

const userCooldowns = new Map();
const USER_COOLDOWN_TIME = 5000; 
let globalRequestTimestamps = [];
const GLOBAL_MAX_REQUESTS = 15; 

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question')
                .setRequired(true)
        ),
    category: "Fun",

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const userId = interaction.user.id;
        const now = Date.now();

        globalRequestTimestamps = globalRequestTimestamps.filter(timestamp => now - timestamp < 60000);

        if (globalRequestTimestamps.length >= GLOBAL_MAX_REQUESTS) {
            return interaction.reply({ content: `🥶 **the 8-ball is overheating.** wait a minute gng 📉`, ephemeral: true });
        }

        if (userCooldowns.has(userId)) {
            return interaction.reply({ content: `💀 **lil bro chill, stop spamming.**`, ephemeral: true });
        }

        await interaction.deferReply();
        userCooldowns.set(userId, now);
        globalRequestTimestamps.push(now);
        setTimeout(() => userCooldowns.delete(userId), USER_COOLDOWN_TIME);

        let finalAnswer = "";
        let errorOccurred = false;

        if (!MISTRAL_API_KEY) {
            finalAnswer = "⚠️ **Error:** MISTRAL_API_KEY is missing in your dashboard.";
            errorOccurred = true;
        } else {
            try {
                // MISTRAL API ENDPOINT
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${MISTRAL_API_KEY.trim()}`
                    },
                    body: JSON.stringify({
                        model: "open-mistral-nemo",
                        messages: [
                            {
                                role: "system",
                                content: "You are a hilarious, sarcastic 8-ball bot for a Minecraft server. Use lowercase, use gaming slang (cooked, capping, gng), and add 1-3 emojis (💀, 😭, 🤡). You MUST finish your sentence."
                            },
                            { role: "user", content: question }
                        ],
                        temperature: 0.9,
                        max_tokens: 60
                    })
                });

                const data = await response.json();
                
                if (data.choices && data.choices[0]?.message?.content) {
                    finalAnswer = data.choices[0].message.content.trim();
                } else {
                    throw new Error(data.error?.message || "Unknown Mistral Error");
                }
            } catch (error) {
                console.error('8Ball Mistral Error:', error);
                finalAnswer = `⚠️ **Mistral Error:** ${error.message}`;
                errorOccurred = true;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔮 The Custom 8-Ball')
            .setColor(errorOccurred ? '#FF3333' : '#00FFCC') 
            .addFields(
                { name: '❓ Your Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: '🎱 The Answer', value: errorOccurred ? finalAnswer : `> **${finalAnswer}**`, inline: false }
            )
            .setFooter({ text: `Mode: 🍃 Mistral AI` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
