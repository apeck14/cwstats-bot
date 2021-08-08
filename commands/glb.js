const { groupBy } = require("lodash");
const { getMembers } = require("../util/clanUtil");
const { average, orange, red } = require("../util/otherUtil");

module.exports = {
    name: 'glb',
    execute: async (message, arg, bot, db) => {
        const matches = db.collection('Matches');
        const guilds = db.collection("Guilds");

        const { channels, clanTag, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        const memberTags = await getMembers(clanTag, true);
        if (!memberTags) return message.channel.send({ embed: { color: orange, description: `Invalid clan tag. Please make sure you have set the correct clan tag for your server.` } });

        const allMatches = await matches.find({}).toArray();
        const allMatchesGrouped = groupBy(allMatches, 'tag');

        const leaderboard = []; //hold all average fames

        for (const tag in allMatchesGrouped) { //loop through collection
            const weeks = allMatchesGrouped[tag];

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

        if (leaderboard.length === 0) return message.channel.send({ embed: { color: orange, description: `**No data available at this time. Something went wrong.` } }); //if no members on lb

        const desc = () => {
            let indeces = (leaderboard.length < 25) ? leaderboard.length : 25;

            let str = '';

            //above 4k
            for (let i = 0; i < indeces; i++) {
                const { name, avgFame, tag } = leaderboard[i];

                let nameStr;

                if(memberTags.indexOf(tag) !== -1) nameStr = `**${name}**`;
                else nameStr = `${name}`;

                if (i === 0) str += `🥇 ${nameStr} (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
                else if (i === 1) str += `🥈 ${nameStr} (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
                else if (i === 2) str += `🥉 ${nameStr} (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
                else str += `**${i + 1}.** ${nameStr} (<:fame:807475879215104020>${avgFame.toFixed(0)})\n`;
            }

            return str;
        };

        const lbEmbed = {
            color: color,
            title: `__CW2 Fame Leaders__`,
            description: desc()
        }

        message.channel.send({ embed: lbEmbed });

    }
}