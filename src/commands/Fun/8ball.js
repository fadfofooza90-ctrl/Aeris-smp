import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a definitive question')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask the 8-ball')
                .setRequired(true)
        ),
    category: "Fun",

    async execute(interaction) {
        const question = interaction.options.getString('question');

        // The upgraded, highly unhinged response pool
        const responses = [
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

        // Pick a completely random index from the array
        const randomAnswer = responses[Math.floor(Math.random() * responses.length)];

        // Build the clean embed reply
        const embed = new EmbedBuilder()
            .setTitle('🔮 The Magic 8-Ball')
            .setColor('#4B0082') 
            .addFields(
                { name: '❓ Your Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: '🎱 The Answer', value: `> **${randomAnswer}**`, inline: false }
            )
            .setFooter({ text: `Asked by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
