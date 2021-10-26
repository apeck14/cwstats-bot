module.exports = {
    name: 'guildDelete',
    once: false,
    execute: (bot, db, guild) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        guilds.deleteOne({ guildID: guild.id });
        statistics.updateOne({}, { $inc: { guilds: -1 } });

        console.log(guild)

        if (guild.id !== '898782595750428712' && guild.id !== '901538946222293002') console.log(`LEFT GUILD: ${guild.name}`);
    }
}