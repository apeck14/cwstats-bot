const { getClanBadge } = require("../util/clanUtil");
const { request, red, orange, getEmoji } = require("../util/otherUtil");

module.exports = {
    name: 'race',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');

        let { channels, color, clanTag, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        if (arg) clanTag = (arg[0] === '#') ? arg.toUpperCase().replace('O', '0') : '#' + arg.toUpperCase().replace('O', '0');

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });
        if (!clanTag) return message.channel.send({ embed: { color: red, description: `**No clan tag linked!** Please use \`${prefix}setClanTag\` to link your clan.` } });

        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}/currentriverrace`);
        if (!rr) return message.channel.send({ embed: { color: red, description: `**Invalid clan tag, or clan is not in a race!**` } });
        else if (rr.clans.length <= 1) return message.channel.send({ embed: { color: orange, description: `**This clan is not in a race.**` } }); //no race happening

        const isCololsseum = rr.periodType === 'colosseum';
        const score = (isCololsseum) ? 'fame' : 'periodPoints';
        const clans = rr.clans
            .sort((a, b) => b[score] - a[score])
            .map(c => ({
                name: c.name,
                tag: c.tag,
                medals: c[score],
                attacksUsedToday: c.participants.reduce((a, b) => a + b.decksUsedToday, 0),
                badgeId: c.badgeId,
                clanWarTrophies: c.clanScore
            }));

        const battleDaysCompleted = () => {
            const dayOfWeek = rr.periodIndex % 7; // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)
            if (!isCololsseum || dayOfWeek <= 3) return 0;
            else return dayOfWeek - 3;
        }

        const avgFame = c => {
            if (isCololsseum) {
                if (c.attacksUsedToday === 0 && battleDaysCompleted() === 0) return 0;
                return c.medals / (c.attacksUsedToday + (200 * battleDaysCompleted()));
            }
            else {
                if (c.attacksUsedToday === 0) return 0;
                return c.medals / c.attacksUsedToday;
            }
        }

        const projectedFame = c => {
            let projFame;

            if (isCololsseum) projFame = c.medals + (c.avgFame * (200 - c.attacksUsedToday + (200 * (3 - battleDaysCompleted())))); //projected weekly fame
            else projFame = c.medals + ((200 - c.attacksUsedToday) * c.avgFame); //projected daily fame

            return Math.round(projFame / 50) * 50;
        }

        //set average and projected fame
        for (const c of clans) {
            c.avgFame = avgFame(c);
            c.projFame = projectedFame(c);
        }

        //set ranks (in case of ties) and average fame
        for (let i = 0; i < clans.length; i++) {
            const tiedClans = clans.filter(c => c.medals === clans[i].medals);

            for (const c of tiedClans) {
                clans.find(x => x.tag === c.tag).rank = i + 1;
            }

            i += tiedClans.length - 1;
        }

        const desc = () => {
            let str = ``;

            for (const c of clans) {
                const badgeEmoji = getEmoji(bot, getClanBadge(c.badgeId, c.clanWarTrophies));
                const fameEmoji = getEmoji(bot, 'fame');

                if (c.tag === clanTag)
                    str += `**${c.rank}. ${badgeEmoji} __${c.name}__**\n${fameEmoji} **${c.medals}**\nProj. Fame: **${c.projFame.toFixed(0)}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nFame/Atk: **${c.avgFame.toFixed(1)}**\n\n`;
                else
                    str += `**${c.rank}.** ${badgeEmoji} **${c.name}**\n${fameEmoji} ${c.medals}\nProj. Fame: ${c.projFame.toFixed(0)}\nAtks. Left: ${200 - c.attacksUsedToday}\nFame/Atk: ${c.avgFame.toFixed(1)}\n\n`;
            }

            return str;
        }

        return message.channel.send({
            embed: {
                color: color,
                title: (isCololsseum) ? `__Colosseum Week__` : `__Current River Race__`,
                description: desc(),
                thumbnail: {
                    url: 'https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest?cb=20180425130200'
                },
                footer: {
                    text: (isCololsseum) ? 'Missed attacks negatively affect avg. fame' : ''
                }
            }
        });
    }
}