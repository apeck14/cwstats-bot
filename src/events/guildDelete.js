module.exports = {
    event: "guildDelete",
    run: async (client, db, guild) => {
        const guilds = db.collection('Guilds');

        guilds.deleteOne({ guildID: guild.id });

        console.log(`LEFT GUILD: ${guild.name} (${guild.id})`);
    }
};