const { Client } = require('discord.js');
const { MongoClient } = require('mongodb');
const mdbClient = new MongoClient(process.env.uri, { useUnifiedTopology: true, useNewUrlParser: true });
const { LoadCommands, LoadEvents } = require('./functions/loaders');

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

mdbClient
    .connect()
    .then(() => {
        console.log('Connected to database!');

        LoadCommands(bot);
        LoadEvents(bot, mdbClient);
    })
    .catch((e) => {
        console.error(e);
    });

process.on('SIGINT', async () => {
    await mdbClient.close();

    console.log('Database closed!');
    process.exit();
});

bot.login(process.env.token);