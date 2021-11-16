const { Client, Intents } = require('discord.js');
const { LoadCommands, LoadEvents } = require('./functions/loaders');
const mongo = require('./mongo');

const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

(async () => {
    await mongo.init();
})();

LoadCommands(bot);
LoadEvents(bot);

bot.login(process.env.token);