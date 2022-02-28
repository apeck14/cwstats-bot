const fs = require("fs");
const slash = require("../util/slash");

module.exports = {
    event: "ready",
    oneTime: true,
    run: async (client) => {
        const commandFiles = fs.readdirSync("./src/commands");

        client.user.setActivity('/update');

        let commandsArray = [];
        commandFiles.forEach((file) => {
            const command = require(`../commands/${file}`);
            client.commands.set(command.data.name, command);

            commandsArray.push(command);
        });

        const finalArray = commandsArray.map((e) => e.data);
        slash.register(client.user.id, finalArray);
        console.log(`${client.user.tag} Started`);

        //make sure all current guilds have a spot in database, in case the bot joined while down
        const guilds = db.collection('Guilds');

        client.guilds.cache.each(async g => {
            const guildInDb = await guilds.findOne({ guildID: g.id });

            if (!guildInDb) {
                guilds.insertOne({
                    guildID: guild.id,
                    channels: {
                        applyChannelID: null,
                        applicationsChannelID: null,
                        commandChannelID: null
                    },
                    abbreviations: []
                });

                console.log(`JOINED GUILD: ${guild.name} (${guild.id})`);
            }
        });
    },
};
