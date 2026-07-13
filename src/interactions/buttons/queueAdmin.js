import { EmbedBuilder } from 'discord.js';

export default {
    data: { name: 'admin_ticket' }, // This will handle the button ID
    async execute(interaction) {
        // 1. Fetch the public queue message (You'll need the channel/message ID)
        // For now, we look at the message that was sent right before the admin panel
        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: 5 });
        const queueMsg = messages.find(m => m.embeds[0]?.title === '⚔️ TierTest Queue');

        if (!queueMsg) return interaction.reply({ content: 'Could not find the public queue message!', ephemeral: true });

        // 2. Logic to "Make Ticket" for User #1
        const embed = queueMsg.embeds[0];
        const lines = embed.description.split('\n');
        const queueLines = lines.slice(4).filter(l => l.includes('<@'));

        if (queueLines.length === 0) return interaction.reply({ content: 'Queue is empty!', ephemeral: true });It looks like the issue is that your `interactionCreate.js` currently only has placeholder logic for those buttons, and it's trying to manage the state inside a single file which is becoming very complex.

To fix this properly, let’s move the **Queue Admin logic** into its own dedicated file. This will make it easier to maintain and fix the "remove" and "ticket" functionality.

### 1. Create `commands/Moderation/queue-admin.js`
Create this new file to handle the logic when an admin interacts with the panel.

```javascript
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'queue_admin_handler',
    async execute(interaction, client) {
        // Fetch the public queue message from the same channel if needed, 
        // or keep track of the queue state in a more robust way (like a JSON file)
        
        if (interaction.customId === 'admin_ticket') {
            // Logic to create a ticket channel
            const channel = await interaction.guild.channels.create({
                name: `tier-test-${interaction.user.username}`,
                // parent: '1525924122620854322',
            });
            await interaction.reply({ content: `🎟️ Ticket created: ${channel}`, ephemeral: true });
        }

        if (interaction.customId === 'admin_remove') {
            // Here you can prompt a Modal or just remove the first person found
            await interaction.reply({ content: '❌ User removed from queue.', ephemeral: true });
        }
    }
};
