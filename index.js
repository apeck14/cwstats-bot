const { Client, Collection } = require('discord.js');
const fs = require('fs');
const mongoUtil = require('./util/mongoUtil');

const bot = new Client();
bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

bot.once('ready', async () => {
    console.log('CW2Stats is online!');

    bot.user.setActivity(`Use help command :)`);
});

bot.on('disconnect', () => {
    console.log('CRWarBot has disconnected.');
});

bot.on('err', e => {
    console.error(e);
});

bot.on('message', async message => {
    const db = await mongoUtil.db("General");
    const guilds = db.collection("Guilds");
    const prefix = (await guilds.findOne({ guildID: message.channel.guild.id })).prefix;

    if (message.author.bot || !message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    args = args.join(" ");

    if (!bot.commands.has(command)) return;

    try {
        //increment commands used in statistics
        const statistics = db.collection("Statistics");
        statistics.updateOne({}, { $inc: { commandsUsed: 1 } });

        message.channel.startTyping();
        await bot.commands.get(command).execute(message, args, bot, prefix);
        message.channel.stopTyping();
    } catch (err) {
        console.error(err);
    }
});

//when bot joins new guild
bot.on('guildCreate', async guild => {
    const db = await mongoUtil.db("General");
    const guilds = db.collection("Guilds");
    const statistics = db.collection("Statistics");

    guilds.insertOne(
        {
            guildID: guild.id,
            clanTag: null,
            prefix: '?',
            adminRoleID: null,
            color: '#ff237a', //pink
            channels: {
                applyChannelID: null,
                applicationsChannelID: null,
                commandChannelID: null
            }
        }
    );

    statistics.updateOne({}, { $inc: { guilds: 1 } });

    console.log(`JOINED GUILD: ${guild.name}`);
});

//when bot leaves guild
bot.on('guildDelete', async guild => {
    const db = await mongoUtil.db("General");
    const guilds = db.collection("Guilds");
    const statistics = db.collection("Statistics");

    guilds.deleteOne({ guildID: guild.id });
    statistics.updateOne({}, { $inc: { guilds: -1 } });

    console.log(`LEFT GUILD: ${guild.name}`);
});

bot.on('reconnecting', () => {
    console.log('Clams is reconnecting...');
});

bot.login(process.env.token);