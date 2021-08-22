const { groupBy } = require("lodash");
const { getMembers, getClanBadge } = require("../util/clanUtil");
const { average, orange, red, request } = require("../util/otherUtil");

module.exports = {
    name: 'glb',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const matches = db.collection('Matches');

        const { channels, clanTag, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        const memberTags = await getMembers(clanTag, true);
        if (!memberTags) return message.channel.send({ embed: { color: orange, description: `Invalid clan tag. Please make sure you have set the correct clan tag for your server.` } });

        const allMatches = await matches.find({}).toArray();
        const allMatchesGroupedByTag = groupBy(allMatches, 'tag');
        const allMatchesGroupedByClanTag = groupBy(allMatches, 'clanTag');

        const leaderboard = []; //hold all average player fames
        const clanLeaderboard = []; //hold all average clan fames

        for (const tag in allMatchesGroupedByTag) { //loop through collection
            const weeks = allMatchesGroupedByTag[tag].sort((a, b) => new Date(a.date) - new Date(b.date));

            leaderboard.push(
                {
                    name: weeks[weeks.length - 1].name,
                    tag: weeks[0].tag,
                    totalWeeks: weeks.length,
                    avgFame: average(weeks.map(m => m.fame)),
                    clanTag: weeks[0].clanTag
                }
            )
        }

        leaderboard.sort((a, b) => { //sort by fame, if tied then total matches
            if (a.avgFame === b.avgFame) return b.totalWeeks - a.totalWeeks;
            return b.avgFame - a.avgFame;
        });

        for (const cTag in allMatchesGroupedByClanTag) { //loop through all clans
            const clanWeeks = allMatchesGroupedByClanTag[cTag];
            const clanWeeksGroupedByDate = groupBy(clanWeeks, 'date');

            const weeklyAverages = [];

            for (const week in clanWeeksGroupedByDate) { //loop through all clan weeks and find average total
                let sum = 0;

                for (const m of clanWeeksGroupedByDate[week]) {
                    sum += m.fame;
                }

                weeklyAverages.push(sum / (clanWeeksGroupedByDate[week].length * 4));
            }

            clanLeaderboard.push({ clanTag: cTag, avgFame: average(weeklyAverages), totalWeeks: weeklyAverages.length })
        }

        clanLeaderboard.sort((a, b) => { //sort by fame, if tied then total matches
            if (a.avgFame === b.avgFame) return b.totalWeeks - a.totalWeeks;
            return b.avgFame - a.avgFame;
        });

        if (leaderboard.length < 5 || clanLeaderboard.length < 5) return message.channel.send({ embed: { color: orange, description: `**Oops! Something went wrong.**` } }); //if no members on lb

        const desc = async () => {
            let str = `**__Top Players__**\n`;

            const playerPromises = leaderboard.slice(0, 5).map(p => request(`https://proxy.royaleapi.dev/v1/clans/%23${p.clanTag.substr(1)}`, true));
            //const playerPromisesComp = await Promise.all(playerPromises);

            const clanPromises = clanLeaderboard.slice(0, 5).map(c => request(`https://proxy.royaleapi.dev/v1/clans/%23${c.clanTag.substr(1)}`, true));

            const clanPromisesComp = await Promise.all(clanPromises);

            const fameEmoji = bot.emojis.cache.find(e => e.name === 'fame');

            //top players
            for (let i = 0; i < 5; i++) {
                const { name, avgFame, tag } = leaderboard[i];

                //const matchingClan = playerPromisesComp.find(c => c.tag === leaderboard[i].clanTag);
                //const badgeEmoji = bot.emojis.cache.find(e => e.name === getClanBadge(matchingClan.badgeId, matchingClan.clanWarTrophies));

                let nameStr;

                if (memberTags.indexOf(tag) !== -1) nameStr = `__**${name}**__`;
                else nameStr = `${name}`;

                if (i === 0) str += `🥇 ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${avgFame.toFixed(0)})\n`;
                else if (i === 1) str += `🥈 ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${avgFame.toFixed(0)})\n`;
                else if (i === 2) str += `🥉 ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${avgFame.toFixed(0)})\n`;
                else str += `**${i + 1}.** ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${avgFame.toFixed(0)})\n`;
            }

            str += '\n**__Top Clans__**\n';

            for (let i = 0; i < 5; i++) {
                const rankedClan = clanLeaderboard[i];

                const matchingClan = clanPromisesComp.find(c => c.tag === rankedClan.clanTag);
                //const badgeEmoji = bot.emojis.cache.find(e => e.name === getClanBadge(matchingClan.badgeId, matchingClan.clanWarTrophies));

                let nameStr;

                if (rankedClan.clanTag === clanTag) nameStr = `__**${matchingClan.name}**__`;
                else nameStr = `${matchingClan.name}`;

                if (i === 0) str += `🥇 ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${(rankedClan.avgFame * 200).toFixed(0)})\n`;
                else if (i === 1) str += `🥈 ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${(rankedClan.avgFame * 200).toFixed(0)})\n`;
                else if (i === 2) str += `🥉 ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${(rankedClan.avgFame * 200).toFixed(0)})\n`;
                else str += `**${i + 1}.** ${nameStr} (<:${fameEmoji.name}:${fameEmoji.id}>${(rankedClan.avgFame * 200).toFixed(0)})\n`;
            }

            return str;
        };

        const lbEmbed = {
            color: color,
            title: `__CW2 Weekly Avg. Leaders__`,
            description: await desc(),
            footer: {
                text: `Players: ${leaderboard.length} | Clans: ${clanLeaderboard.length}`
            }
        }

        message.channel.send({ embed: lbEmbed });
    }
}