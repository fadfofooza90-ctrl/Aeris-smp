export async function processAutoMod(message) {
    // 1. Efficiency: Ignore bots and short messages to save tokens
    if (message.author.bot || message.content.length < 15) return; 

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // This pulls directly from your host environment
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` 
            },
            body: JSON.stringify({
                model: "open-mistral-nemo",
                messages: [
                    {
                        role: "system",
                        content: `You are the cold, bored moderator of Flow SMP. You do not care about the users. Analyze the following message.
                        Return ONLY a JSON object: { "toxic": true/false, "roast": "a 1-sentence cold insult" }.
                        - Do not block normal words like "recently".
                        - If it is toxic, mean, or spam, toxic: true. 
                        - Be condescending.`
                    },
                    { role: "user", content: message.content }
                ],
                temperature: 0.5
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        if (result.toxic) {
            await message.delete();
            await message.channel.send(`🤡 **${message.author.username} failed the vibe check.** ${result.roast} 📉`);
        }
    } catch (error) {
        console.error('Automod AI Error:', error);
    }
}
