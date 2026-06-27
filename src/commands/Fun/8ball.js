import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question and get a custom AI answer')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask the 8-ball')
                .setRequired(true)
        ),
    category: "Fun",

    async execute(interaction) {
        const question = interaction.options.getString('question');

        await interaction.deferReply();

        let finalAnswer = "";
        let errorOccurred = false;

        if (!GEMINI_API_KEY) {
            finalAnswer = "⚠️ **Error:** The `GEMINI_API_KEY` variable is missing from your host dashboard panel.";
            errorOccurred = true;
        } else {
            try {
                const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': GEMINI_API_KEY.trim()
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a savage, witty Magic 8-Ball bot inside a competitive Minecraft SMP Discord server named Flow SMP.
                                A player (or the server owner) is asking you a question. Give a full, hilarious response using modern gaming community slang or casual chat slang (like cooked, real, capping, gng, 💀, we up, valid).
                                
                                CRITICAL OUTPUT RULES:
                                1. You must output a FULL, complete sentence. Never leave it cut off or halfway finished.
                                2. Do NOT use generic, boring old 8-ball responses like "My sources say no" or "Concentrate and ask again". Act like a real player in the chat.
                                3. Keep your entire answer between 1 and 2 sentences max.
                                
                                User Question: "${question}"`
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 100,
                            temperature: 0.88
                        }
                    })
                });

                if (!response.ok) {
                    let errorDetails = `Status Code ${response.status}`;
                    try {
                        const errData = await response.json();
                        if (errData.error && errData.error.message) {
                            errorDetails = errData.error.message;
                        }
                    } catch {
                        errorDetails = await response.text();
                    }
                    throw new Error(errorDetails);
                }

                const data = await response.json();
                
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    finalAnswer = data.candidates[0].content.parts[0].text.trim();
                } else {
                    throw new Error("Invalid response structure from Google Gemini API.");
                }
            } catch (error) {
                console.error('8Ball Gemini System Error:', error);
                finalAnswer = `⚠️ **Google API Error:** ${error.message}`;
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
            .setFooter({ 
                text: `Asked by ${interaction.user.username} • Mode: ♊ 100% Google Gemini AI` 
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
