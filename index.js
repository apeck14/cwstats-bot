const fs = require("fs");
require('dotenv').config({ debug: true });

const mongo = require("./src/util/mongo");
mongo.init();

const { Client, Collection, Intents } = require("discord.js");

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

client.commands = new Collection();

const events = fs.readdirSync("./src/events");

events.forEach((event) => {
    const eventFile = require(`./src/events/${event}`);
    if (eventFile.once) {
        client.once(eventFile.event, (...args) => eventFile.run(client, mongo.db, ...args));
    } else {
        client.on(eventFile.event, (...args) => eventFile.run(client, mongo.db, ...args));
    }
});

client.login(process.env.TOKEN);

process.on('unhandledRejection', e => {
    if (client.isReady()) console.error(e);
    return;
});
