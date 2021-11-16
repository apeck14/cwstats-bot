const { Collection } = require('discord.js');
const fs = require('fs');
const mongo = require('../mongo');

module.exports = {
    LoadCommands: (bot) => {
        bot.commands = new Collection();
        bot.aliases = new Collection();

        const commandFiles = fs.readdirSync('./commands');

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            bot.commands.set(command.name, command);

            for (const alias of command.aliases) {
                bot.aliases.set(alias, command.name);
            }
        }

        console.log('Commands loaded!');
    },
    LoadEvents: async (bot) => {
        const eventFiles = fs.readdirSync('./events');

        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                bot.once(event.name, (...args) => event.execute(bot, mongo.db, ...args));
            } else {
                bot.on(event.name, (...args) => event.execute(bot, mongo.db, ...args));
            }
        }

        console.log('Events loaded!');
    }
}