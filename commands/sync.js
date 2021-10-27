const { ApiRequest } = require("../functions/api");
const { parseDate, getEmoji } = require("../functions/util");
const { orange } = require("../data/colors");

module.exports = {
    name: 'sync',
    aliases: ['sync'],
    description: 'Add weekly war stats for your clans',
    parameters: ['1-3'],
    disabled: true,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const matches = db.collection('Matches');
        const weeksAdded = db.collection('Weeks_Added');

        const { channels, adminRoleID, clans, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { tag1, tag2, tag3 } = clans;
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        //must be server owner or admin role
        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && message.author.id !== '493245767448789023') throw 'Only **admins** can use this command!';
        else if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tag;

        if (!args[0] || args[0] === '1') {
            if (!tag1) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan1 #ABC123\`\`\``;
            tag = tag1;
        }
        else if (args[0] === '2') {
            if (!tag2) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan2 #ABC123\`\`\``;
            tag = tag2;
        }
        else if (args[0] === '3') {
            if (!tag3) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan3 #ABC123\`\`\``;
            tag = tag3;
        }
        else throw '**Invalid paramter.**';

        const log = await ApiRequest('riverracelog', tag);

        if (!log || log.length === 0) return message.channel.send({ embed: { color: orange, description: 'Clan has no data to add.' } });

        let raceLog = log.map(r => ({
            sectionIndex: r.sectionIndex,
            createdDate: r.createdDate,
            clan: r.standings.find(c => c.clan.tag === tag).clan
        }));

        for (const r of raceLog) { //set createdDateStr
            const weekDate = parseDate(r.createdDate);
            weekDate.setTime(weekDate.getTime() - (24 * 60 * 60 * 1000)); //subtract one day

            r.clan.participants.sort((a, b) => b.fame - a.fame); //sort by fame
            r.createdDate = weekDate;
            r.createdDateStr = `${weekDate.getUTCMonth() + 1}/${weekDate.getUTCDate()}/${weekDate.getUTCFullYear()}`;
        }

        const weeksAddedForClan = (await weeksAdded.find({ clanTag: tag }).toArray()).map(w => w.date);

        //RACELOG FILTERS
        raceLog = raceLog.filter(r => r.clan.participants.length > 0 && r.clan.fame > 0) //filter weeks with no participants to add
            .filter(r => parseDate(r.createdDate) > parseDate('20210621T000000.000Z')) //created date is past most recent update's first week (first week is bugged)
            .filter(r => weeksAddedForClan.indexOf(r.createdDateStr) === -1) //filter out weeks that have already been added
            .reverse(); //start with oldest weeks

        raceLog.forEach(r => r.clan.participants = r.clan.participants.filter(p => p.fame >= 1600 && p.decksUsed >= 16 && p.boatAttacks === 0)); //filter out players that didnt use all 16 war attacks

        if (raceLog.length === 0) return message.channel.send({ embed: { color: orange, description: `**There are no new weeks to add at this time!**` } });

        let desc = '';

        //ADD NEW WEEKS
        for (const r of raceLog) {
            weeksAdded.insertOne({ clanTag: tag, date: r.createdDateStr }); //add week to Weeks Added in DB

            //add all matches from all weeks
            //sort each players matches by date
            //remove all matches past maxMatchesAllowed limit (keeep most recent)

            for (const p of r.clan.participants) { //loop through particpiants
                const maxMatchesAllowed = 15; //CHANGE AS NEEDED
                const playerMatches = (await matches.find({ tag: p.tag }).toArray()).sort((a, b) => new Date(a.date) - new Date(b.date));

                if (playerMatches.length >= maxMatchesAllowed) {
                    for (let i = 0; i < (playerMatches.length - maxMatchesAllowed) + 1; i++) {
                        await matches.deleteOne(playerMatches[i]);
                    }
                }

                await matches.insertOne({
                    name: p.name,
                    tag: p.tag,
                    date: r.createdDateStr,
                    clanTag: tag,
                    fame: p.fame,
                    clanTrophies: r.clan.clanScore,
                    badgeId: r.clan.badgeId
                });
            }

            desc += `• **Week ${r.sectionIndex + 1} (${r.createdDateStr})**\n`;

            const fameEmoji = getEmoji(bot, 'fame');

            if (raceLog.length < 5) {
                for (let i = 0; i < r.clan.participants.length; i++) {
                    if (i === 0) desc += `${i + 1}. ${r.clan.participants[i].name} ${fameEmoji}${r.clan.participants[i].fame}\n`; //1st
                    else if (i === 1) desc += `${i + 1}. ${r.clan.participants[i].name} ${fameEmoji}${r.clan.participants[i].fame}\n`; //2nd
                    else if (i === 2) desc += `${i + 1}. ${r.clan.participants[i].name} ${fameEmoji}${r.clan.participants[i].fame}\n`; //3rd
                    else if (i === r.clan.participants.length - 3 && i > 2) desc += `...\n${i + 1}. ${r.clan.participants[i].name} ${fameEmoji}${r.clan.participants[i].fame}\n`; //third to last
                    else if (i === r.clan.participants.length - 2 && i > 2) desc += `${i + 1}. ${r.clan.participants[i].name} ${fameEmoji}${r.clan.participants[i].fame}\n`; //second to last
                    else if (i === r.clan.participants.length - 1 && i > 2) desc += `${i + 1}. ${r.clan.participants[i].name} ${fameEmoji}${r.clan.participants[i].fame}\n\n`; //last
                }
            }
        }

        return message.channel.send({
            embed: {
                color: color,
                description: `✅ **${raceLog.length} New Week(s) Added!**\n\n` + desc,
                footer: {
                    text: `Players deemed to have missed battle days are not added.`
                },
                author: {
                    name: `${raceLog[0].clan.name} | ${raceLog[0].clan.tag}`
                }
            }
        });

    }
}