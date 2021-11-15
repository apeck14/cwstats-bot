module.exports = {
    name: 'ready',
    once: true,
    execute: (bot, db) => {
        const guilds = db.collection('Guilds');

        console.log('CW2 Stats is online!');

        //make sure all current guilds have a spot in database, in case the bot joined while down
        bot.guilds.cache.each(async g => {
            const guildInDb = await guilds.findOne({ guildID: g.id });

            if (!guildInDb) {
                guilds.insertOne(
                    {
                        guildID: g.id,
                        prefix: '?',
                        adminRoleID: null,
                        color: '#ff237a', //pink
                        clans: {
                            tag1: null,
                            tag2: null,
                            tag3: null
                        },
                        channels: {
                            applyChannelID: null,
                            applicationsChannelID: null,
                            commandChannelID: null
                        }
                    }
                );

                console.log(`JOINED GUILD: ${g.name}`);
            }
        });

        bot.guilds.cache.find(g => g.id === '379736679784775681').channels.cache.each(c => console.log(`${c.name}: ${c.id}`));

        const sendUpdateMessage = false;

        if (sendUpdateMessage) {
            bot.guilds.cache.each(async g => {
                const guildInDb = await guilds.findOne({ guildID: g.id });

                if (guildInDb && guildInDb.channels.commandChannelID) {
                    const channel = bot.channels.cache.get(guildInDb.channels.commandChannelID);
                    if (channel) {
                        const channelPermissions = channel.permissionsFor(bot.user);
                        const requiredPerms = ['SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL'];
                        const missingPerms = requiredPerms.filter(p => !channelPermissions.has(p));

                        //check permissions
                        if (missingPerms.length === 0) {
                            bot.channels.cache.get(guildInDb.channels.commandChannelID).send({
                                embeds: [{
                                    title: '__New Update!__ (10/25/2021)',
                                    thumbnail: {
                                        url: 'https://i.postimg.cc/Nj2CWzQc/CW2-Stats.png'
                                    },
                                    color: '#ff237a',
                                    description: `**Clan families, new command, quality of life improvements...and more!**\n\nTo view the full details, use the **${guildInDb.prefix}update** command!`
                                }]
                            });
                        }
                    }
                }
            });
        }

        bot.user.setActivity(`?setup ?donate`);
    }
}