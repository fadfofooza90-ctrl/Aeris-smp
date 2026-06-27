import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// 🔑 PASTE YOUR AI API KEY HERE
const AI_API_KEY = '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'; 

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question (Random or AI powered)')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask the 8-ball')
                .setRequired(true)
        ),
    category: "Fun",

    async execute(interaction) {
        const question = interaction.options.getString('question');

        // Local unhinged response pool
        const localResponses = [
            "buddy im not fucking gpt 🤫",
            "ts guy thinks i have 100 ram inside my ahh 😭",
            "Idk gng why u asking me 💀",
            "It is certain 🟢",
            "Without a doubt ✅",
            "Signs point to yes, we up 🔥",
            "Reply hazy, wrap it up and try again 🟡",
            "Better not tell you now 🤫",
            "Concentrate and ask again 🔄",
            "Don't count on it, it's over for u 📉",
            "My sources say no ❌",
            "Bro, absolutely not 🚫"
        ];

        let finalAnswer = "";
        let isAiGenerated = false;

        // 🎲 Flip a coin: 50% chance to attempt AI response
        const rollForAI = Math.random() > 0.5;

        if (rollForAI && AI_API_KEY && AI_API_KEY !== 'YOUR_OPENAI_API_KEY') {
            // Defer the reply immediately since AI APIs can take a couple of seconds to respond
            await interaction.deferReply();

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini', // Lightweight, fast, and cheap model
                        messages: [
                            { 
                                role: 'system', 
                                content: 'You are a hilarious, witty Magic 8-Ball inside a Minecraft SMP Discord server. Give a clever, funny, or genuinely good prediction/answer to the user\'s question. Keep it very short (1 sentence max) and use modern casual language matching a gaming community.' 
                            },
                            { role: 'user', content: question }
                        ],
                        max_tokens: 50,
                        temperature: 0.8
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    finalAnswer = data.choices[0].message.content.trim();
                    isAiGenerated = true;
                }
            } catch (error) {
                console.error('8Ball AI Error (Falling back to local pool):', error);
                // Fallback to random array if API fails
                finalAnswer = localResponses[Math.floor(Math.random() * localResponses.length)];
            }
        } else {
            // Pick a completely random static answer from your list
            finalAnswer = localResponses[Math.floor(Math.random() * localResponses.length)];
        }

        // Build the clean embed response
        const embed = new EmbedBuilder()
            .setTitle('🔮 The Magic 8-Ball')
            .setColor(isAiGenerated ? '#00FFCC' : '#4B0082') // Cyan for AI, Deep Purple for traditional random
            .addFields(
                { name: '❓ Your Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: '🎱 The Answer', value: `> **${finalAnswer}**`, inline: false }
            )
            .setFooter({ 
                text: `Asked by ${interaction.user.username} • Mode: ${isAiGenerated ? '🧠 AI Matrix' : '🎲 Classic Shaker'}` 
            })
            .setTimestamp();

        // If we deferred for AI, use editReply. Otherwise, do a standard reply.
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
