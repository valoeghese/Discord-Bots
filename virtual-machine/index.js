require("dotenv").config()
const { Worker, isMainThread } = require('worker_threads');
const fs = require("fs");
const token = process.env.token;

if (isMainThread) {
    // Start the VM Worker
    const worker = new Worker("./vm.js");

    // worker.on('message', (message) => {
    //console.log('Received message from worker:', message);});
    //worker.postMessage('Hello from the main thread!');
    
    // Require the necessary discord.js classes
    const { Client, Events, GatewayIntentBits } = require('discord.js');

    // Create a new client instance
    const client = new Client({
        intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });

    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;

        if (message.content.startsWith("dj$")) {
            let command = message.content.substring(3).split(/\s+/);
            let program = command[0];

            if (program === "exec") {

            } else if (program === "kill") {

            } else if (program === "assemble") {
                
            }
        }
    });

    client.once(Events.ClientReady, readyClient => {
        console.log(`Virtual-Machine: Ready! Logged in as ${readyClient.user.tag}`);
    });

    // Log in to Discord with your client's token
    client.login(token);
}
