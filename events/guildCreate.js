module.exports = {
    name: 'guildCreate',
    once: false,
    execute: (bot, db, guild) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        guilds.insertOne(
            {
                guildID: guild.id,
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

        statistics.updateOne({}, { $inc: { guilds: 1 } });

        console.log(`JOINED GUILD: ${guild.name}`);
    }
}