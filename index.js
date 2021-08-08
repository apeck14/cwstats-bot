const { Client, Collection } = require('discord.js');
const fs = require('fs');
const { red } = require('./util/otherUtil');
const { MongoClient } = require('mongodb');
const mdbClient = new MongoClient(process.env.uri, { useUnifiedTopology: true, useNewUrlParser: true });

mdbClient
    .connect()
    .then(() => {
        console.log('Connected to database!');
    })
    .catch((e) => {
        console.err(e);
    });

process.on('exit', async () => {
    console.log('Database closed! EXIT');

    await mdbClient.close();
});

const bot = new Client();
bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

bot.guilds.cache.get('871406430933110805').leave()
        .then(() => {
            console.log('Left server!');
        })
        .catch(err => {
            console.log(`there was an error leaving the guild: \n ${err.message}`);
        });

bot.once('ready', () => {
    console.log('CW2 Stats is online!');

    bot.user.setActivity(`?setup ?help`);
});

bot.on('disconnect', () => {
    console.log('CRWarBot has disconnected.');
});

bot.on('err', e => {
    console.error(e);
});

bot.on('message', async message => {
    try {
        const db = await mdbClient.db('General');
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        const { prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const channelPermissions = message.channel.permissionsFor(bot.user);

        if (message.author.bot || !message.content.startsWith(prefix)) return;

        let args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        args = args.join(" ");

        if (!bot.commands.has(command)) return;

        //CHECK PERMISSIONS
        if (!channelPermissions.has('SEND_MESSAGES')) return;
        if (!channelPermissions.has(['ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'VIEW_CHANNEL']))
            return message.channel.send({ embed: { color: red, description: '**__Missing Permissions__**\n\nPlease make sure I am able to **View Channel**, **Add Reactions**, **Attach Files**, **Embed Links**, and **Use External Emojis** in this channel.' } });

        //increment commands used in statistics
        statistics.updateOne({}, { $inc: { commandsUsed: 1 } });

        message.channel.startTyping();
        await bot.commands.get(command).execute(message, args, bot, db);
        message.channel.stopTyping();
    } catch (err) {
        message.channel.send({ embed: { color: red, description: 'Unexpected error.' } });
        message.channel.stopTyping();
        console.log(`${message.guild?.name} (${message.guild?.id})`);
        console.error(err);
    }
});

//when bot joins new guild
bot.on('guildCreate', async guild => {
    const db = await mdbClient.db('General');
    const guilds = db.collection('Guilds');
    const statistics = db.collection('Statistics');
    
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
    const db = await mdbClient.db('General');
    const guilds = db.collection('Guilds');
    const statistics = db.collection('Statistics');

    guilds.deleteOne({ guildID: guild.id });
    statistics.updateOne({}, { $inc: { guilds: -1 } });

    console.log(`LEFT GUILD: ${guild.name}`);
});

bot.on('reconnecting', () => {
    console.log('Clams is reconnecting...');
});

bot.login(process.env.token);