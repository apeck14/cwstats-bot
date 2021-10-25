const { Collection } = require('discord.js');
const fs = require('fs');

module.exports = {
    LoadCommands: (bot) => {
        bot.commands = new Collection();
        bot.aliases = new Collection();

        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            bot.commands.set(command.name, command);

            for (const alias of command.aliases) {
                bot.aliases.set(alias, command.name);
            }
        }

        console.log('Commands loaded!');
    },
    LoadEvents: async (bot, mdbClient) => {
        const db = await mdbClient.db('General');
        const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                bot.once(event.name, (...args) => event.execute(bot, db, ...args));
            } else {
                bot.on(event.name, (...args) => event.execute(bot, db, ...args));
            }
        }

        console.log('Events loaded!');
    }
}