require("dotenv").config()
const token = process.env.token

// Json file has a very simple setup. [downgraded role id]=[upgraded role id]
const jsonData = require('./roles.json'); // Replace 'data.json' with your JSON file path
console.log('JSON database loaded successfully:', jsonData);

// Function to get lecturers of a user
const axios = require('axios');

async function getLecturerCount(userId) {
    try {
        const response = (await axios.get('https://json.excigma.xyz/get/userdata')).data;
        
        const userData = response[userId];

        if (!userData) {
            return 0;
        }

        return userData.inventory.length;
    } catch (error) {
        console.error('Error fetching data:', error);
        return 0;
    }
}

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const cmd = message.content.toLowerCase().trim();

    if (cmd === "dj/upgrade") {
        for (role of message.member.roles.cache) {
            if (role[0] in jsonData) {
                // we have our role
                let lecturerCount = await getLecturerCount(message.author.id);
                
                if (lecturerCount < 5) {
                    message.react("🤔");
                    message.reply("You need at least 5 lecturers to unlock this feature :eyes:");
                    return;
                }

                message.member.roles.add(jsonData[role[0]])
                    .then(item => message.react("✅"))
                    .catch(err => {
                        console.error("Error granting role", err);
                        message.reply("<@521522396856057876> there was an error granting role!");
                    });
                return;
            }
        }

        message.react("❌");
    } else if (cmd === "dj/downgrade") {
        for ([k, v] of Object.entries(jsonData)) {
            if (message.member.roles.cache.has(v)) {
                message.member.roles.remove(v)
                    .catch(err => {
                        console.error("Error removing role", err);
                        message.reply("<@521522396856057876> there was an error removing role!");
                    });
            }
        }

        message.react("✅");
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
