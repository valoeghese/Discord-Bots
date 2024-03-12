require("dotenv").config()
const token = process.env.token

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try{
            await reaction.fetch();
        } catch (e) {
            console.error("Error retrieving reaction", e);
            return;
        }
    }

    const member = await reaction.message.guild.members.fetch(user);

    if (member.roles.cache.some(role => role.id === process.env.role) && reaction.emoji.name === '📌') {
        reaction.message.pin();
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try{
            await reaction.fetch();
        } catch (e) {
            console.error("Error retrieving reaction", e);
            return;
        }
    }

    const member = await reaction.message.guild.members.fetch(user);

    if (member.roles.cache.some(role => role.id === process.env.role) && reaction.emoji.name === '📌') {
        reaction.message.unpin();
    }
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
