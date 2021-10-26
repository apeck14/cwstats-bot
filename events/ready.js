module.exports = {
    name: 'ready',
    once: true,
    execute: (bot) => {
        console.log('CW2 Stats is online!');

        const sendUpdateMessage = true;

        if (sendUpdateMessage) {
            bot.guilds.cache.each(async g => {
                const guilds = db.collection('Guilds');
                const guildInDb = await guilds.findOne({ guildID: g.id });

                if (guildInDb && guildInDb.channels.commandChannelID) {
                    const channelPermissions = bot.channels.cache.get(guildInDb.channels.commandChannelID).permissionsFor(bot.user);
                    const requiredPerms = ['SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL'];
                    const missingPerms = requiredPerms.filter(p => !channelPermissions.has(p));

                    //check permissions
                    if (missingPerms.length === 0) {
                        bot.channels.cache.get(guildInDb.channels.commandChannelID).send({
                            embed: {
                                title: '__New Update!__ (10/25/2021)',
                                thumbnail: {
                                    url: 'https://i.postimg.cc/Nj2CWzQc/CW2-Stats.png'
                                },
                                color: '#ff237a',
                                description: `**Clan families, new command, quality of life improvements...and more!**\n\nTo view the full details, use the **${guildInDb.prefix}update** command!`
                            }
                        });
                    }
                }
            });
        }

        bot.user.setActivity(`NEW UPDATE: ?update`);
    }
}