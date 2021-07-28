const { getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { average, orange } = require("../util/otherUtil");

module.exports = {
    name: 'lb',
    execute: async (message) => {
        const db = await mongoUtil.db("General");
        const players = db.collection('Players');
        const guilds = db.collection("Guilds");

        const { channels, clanTag, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        const memberTags = await getMembers(clanTag, true);
        if (!memberTags) return message.channel.send({ embed: { color: orange, description: `Invalid clan tag. Please make sure you have set the correct clan tag for your server.` } });

        let memberStats = await players.find({ tag: { $in: memberTags }, 'fameTotals.0': { $exists: true } }).toArray(); //members in clan currently, and have atleast 1 fame score in arr
        memberStats = memberStats.filter(p => p.fameTotals.find(w => w.clanTag === clanTag)); //remove all people with no weeks in current clan

        //add avgFame property to all players and remove all weeks from different clans
        for (const p of memberStats) {
            p.fameTotals = p.fameTotals.filter(w => w.clanTag === clanTag);
            p.avgFame = average(p.fameTotals.map(w => w.fame));
        }

        memberStats.sort((a, b) => { //sort by fame
            if (a.avgFame === b.avgFame) return b.fameTotals.length - a.fameTotals.length; //whoever has more weeks, if completed
            return b.avgFame - a.avgFame;
        });

        if (memberStats.length === 0) return message.channel.send({ embed: { color: orange, description: `No data available! Add player data using \`${prefix}add\`.` } }); //if no members on lb

        const desc = () => {
            const indeces = (memberStats.length < 10) ? memberStats.length : 10;
            let str = '';

            //above 4k
            for (let i = 0; i < indeces; i++) {
                const { name, avgFame } = memberStats[i];

                if (i === 0) str += `🥇 **${name}** (<:fame:807475879215104020>${avgFame})\n`;
                else if (i === 1) str += `🥈 **${name}** (<:fame:807475879215104020>${avgFame})\n`;
                else if (i === 2) str += `🥉 **${name}** (<:fame:807475879215104020>${avgFame})\n`;
                else str += `**${i + 1}.** ${name} (<:fame:807475879215104020>${avgFame})\n`;
            }

            return str;
        };

        const lbEmbed = {
            color: color,
            title: `__Avg. Fame Leaders__`,
            description: desc(),
            footer: {
                text: `Use ${prefix}stats to see your personal stats`
            }
        }

        message.channel.send({ embed: lbEmbed });

    }
}