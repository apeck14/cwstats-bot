const { groupBy } = require('lodash');
const { ApiRequest } = require('../functions/api');
const { average, getClanBadge, getEmoji } = require('../functions/util');
const { orange } = require('../data/colors');

module.exports = {
    name: 'lb',
    aliases: ['lb', 'leaderboard'],
    description: 'View clan war leaderboard(s) for you clan(s)',
    parameters: ['1-3', '1-3 full'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const matches = db.collection('Matches');

        const { channels, clans, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { tag1, tag2, tag3 } = clans;
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tags = [];

        if (!args[0] || args[0].toLowerCase() === 'full') {
            if (tag1) tags.push(tag1);
            if (tag2) tags.push(tag2);
            if (tag3) tags.push(tag3);
        }
        else if (args[0] === '1') {
            if (!tag1) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan1 #ABC123\`\`\``;
            tags.push(tag1);
        }
        else if (args[0] === '2') {
            if (!tag2) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan2 #ABC123\`\`\``;
            tags.push(tag2);
        }
        else if (args[0] === '3') {
            if (!tag3) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan3 #ABC123\`\`\``;
            tags.push(tag3);
        }
        else throw '**Invalid parameter(s).**';

        const memberTags = [];
        let clanWarTrophies, badgeId, header;

        for (const t of tags) {
            const clan = await ApiRequest('', t, 'clans');

            if (!clanWarTrophies) clanWarTrophies = clan.clanWarTrophies;
            if (!badgeId) badgeId = clan.badgeId;
            if (!header) {
                if (tags.length > 1) header = 'All Clans';
                else header = `${clan.name} | ${clan.tag}`;
            }

            memberTags.push(...clan.memberList.map(p => p.tag));
        }

        if (memberTags.length === 0) return message.channel.send({ embed: { color: orange, description: `**No players found in clan(s) currently.**` } });

        const memberMatches = await matches.find({ tag: { $in: memberTags }, clanTag: { $in: tags } }).toArray(); //members in clan currently, and have atleast 1 fame score in arr

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

        if (leaderboard.length === 0) return message.channel.send({ embed: { color: orange, description: `**No data available!** To add data, use \`${prefix}sync\`.` } }); //if no members on lb

        const desc = () => {
            const indeces = () => {
                if ((args[1] && args[1].toLowerCase() === 'full') || (args[0] && args[0].toLowerCase() === 'full')) return (leaderboard.length < 50) ? leaderboard.length : 50;
                else return (leaderboard.length < 10) ? leaderboard.length : 10;
            }

            let str = '';

            const fameEmoji = getEmoji(bot, 'fame');

            //above 4k
            for (let i = 0; i < indeces(); i++) {
                const { name, avgFame } = leaderboard[i];

                if (i === 0) str += `🥇 **${name}** (${fameEmoji}${avgFame.toFixed(0)})\n`;
                else if (i === 1) str += `🥈 **${name}** (${fameEmoji}${avgFame.toFixed(0)})\n`;
                else if (i === 2) str += `🥉 **${name}** (${fameEmoji}${avgFame.toFixed(0)})\n`;
                else str += `**${i + 1}.** ${name} (${fameEmoji}${avgFame.toFixed(0)})\n`;
            }

            return str;
        };

        return message.channel.send({
            embed: {
                color: color,
                title: `__Avg. Fame Leaders__`,
                description: desc(),
                author: {
                    name: header
                },
                footer: {
                    text: `Ranked by avg. fame while in clan | ${prefix}stats`
                },
                files: [{
                    attachment: `./allBadges/${getClanBadge(badgeId, clanWarTrophies, false)}.png`,
                    name: 'badge.png'
                }],
                thumbnail: {
                    url: 'attachment://badge.png'
                }
            }
        });
    }
}