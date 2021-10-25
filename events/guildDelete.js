module.exports = {
    name: 'guildDelete',
    once: false,
    execute: (bot, db, guild) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        guilds.deleteOne({ guildID: guild.id });
        statistics.updateOne({}, { $inc: { guilds: -1 } });

        console.log(`LEFT GUILD: ${guild.name}`);
    }
}