const { groupBy } = require("lodash");
const { getMembers } = require("../util/clanUtil");
const { average, orange, red } = require("../util/otherUtil");

module.exports = {
    name: 'lb',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const matches = db.collection('Matches');

        const { channels, clanTag, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        const memberTags = await getMembers(clanTag, true);
        if (!memberTags) return message.channel.send({ embed: { color: orange, description: `Invalid clan tag. Please make sure you have set the correct clan tag for your server.` } });

        const memberMatches = await matches.find({ tag: { $in: memberTags }, clanTag: clanTag }).toArray(); //members in clan currently, and have atleast 1 fame score in arr

        const groupedMatches = groupBy(memberMatches, 'tag');

        const leaderboard = []; //hold all average fames

        for (const tag in groupedMatches) { //loop through collection
            const weeks = groupedMatches[tag];

            leaderboard.push(
                {
                    name: weeks[weeks.length - 1].name,
                    tag: weeks[0].tag,
                    totalWeeks: weeks.length,
                    avgFame: average(weeks.map(m => m.fame))
                }
            )
        }

        leaderboard.sort((a, b) => { //sort by fame, if tied then total matches
            if (a.avgFame === b.avgFame) return b.totalWeeks - a.totalWeeks;
            return b.avgFame - a.avgFame;
        });

        if (leaderboard.length === 0) return message.channel.send({ embed: { color: orange, description: `**No data available!** To add data, use \`${prefix}add\`.` } }); //if no members on lb

        const desc = () => {
            let indeces = (leaderboard.length < 10) ? leaderboard.length : 10;
            if (arg.toLowerCase() === 'full' || arg.toLowerCase() === 'all') indeces = leaderboard.length; //if arg = 'full' then show all current members on lb

            let str = '';

            //above 4k
            for (let i = 0; i < indeces; i++) {
                const { name, avgFame } = leaderboard[i];

                if (i === 0) str += `🥇 **${name}** (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
                else if (i === 1) str += `🥈 **${name}** (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
                else if (i === 2) str += `🥉 **${name}** (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
                else str += `**${i + 1}.** ${name} (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
            }

            return str;
        };

        const lbEmbed = {
            color: color,
            title: `__Avg. Fame Leaders__`,
            description: desc(),
            footer: {
                text: `Ranked by avg. fame while in clan | ${prefix}stats`
            }
        }

        message.channel.send({ embed: lbEmbed });
    }
}