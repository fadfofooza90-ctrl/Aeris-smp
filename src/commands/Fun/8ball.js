import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Safely grabs the key from your host dashboard environment variables
const AI_API_KEY = process.env.OPENAI_API_KEY; 

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

        // Defer the reply immediately since AI generation takes a brief moment
        await interaction.deferReply();

        let finalAnswer = "";
        let errorOccurred = false;

        // Check if the environment variable is actually present
        if (!AI_API_KEY) {
            finalAnswer = "⚠️ **Error:** The AI API Key is missing from your host panel's environment variables.";
            errorOccurred = true;
        } else {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini', 
                        messages: [
                            { 
                                role: 'system', 
                                content: `You are a hilarious, witty Magic 8-Ball inside a competitive Minecraft SMP Discord server named Flow SMP. 
                                A user is going to ask you a question. Read their question and give a genuinely funny, smart, or accurate answer to it, delivered using modern gaming community slang or casual chat slang. 
                                Keep the response short (1 to 2 sentences max). Do not use placeholders.`
                            },
                            { role: 'user', content: question }
                        ],
                        max_tokens: 80,
                        temperature: 0.85
                    })
                });

                if (!response.ok) {
                    throw new Error(`OpenAI responded with status ${response.status}`);
                }

                const data = await response.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    finalAnswer = data.choices[0].message.content.trim();
                } else {
                    throw new Error("Invalid response structure from OpenAI API.");
                }
            } catch (error) {
                console.error('8Ball AI System Error:', error);
                finalAnswer = "⚠️ **Error:** Failed to connect to the AI Engine. Please check your host console logs or your OpenAI credit balance.";
                errorOccurred = true;
            }
        }

        // Build the updated embed display response
        const embed = new EmbedBuilder()
            .setTitle('🔮 The Custom 8-Ball')
            .setColor(errorOccurred ? '#FF3333' : '#00FFCC') // Red for error, Green/Cyan for success
            .addFields(
                { name: '❓ Your Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: '🎱 The Answer', value: errorOccurred ? finalAnswer : `> **${finalAnswer}**`, inline: false }
            )
            .setFooter({ 
                text: `Asked by ${interaction.user.username} • Mode: 🧠 100% AI Engine` 
            })
            .setTimestamp();

        // Send the completed embed back to the channel
        await interaction.editReply({ embeds: [embed] });
    }
};
