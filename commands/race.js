const { request, red } = require("../util/otherUtil");
const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'race',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("General");
        const guilds = db.collection("Guilds");

        let { channels, color, clanTag, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        if (arg) clanTag = (arg[0] === '#') ? arg.toUpperCase().replace('O', '0') : '#' + arg.toUpperCase().replace('O', '0');

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });
        if (!clanTag) return message.channel.send({ embed: { color: red, description: `**No clan tag linked!** Please use \`${prefix}setClanTag\` to link your clan.` } });

        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}/currentriverrace`);
        if (!rr) return message.channel.send({ embed: { color: red, description: `**Invalid clan tag!**` } });

        const isCololsseum = rr.periodType === 'colosseum';
        const score = (isCololsseum) ? 'fame' : 'periodPoints';
        const clans = rr.clans
            .sort((a, b) => b[score] - a[score])
            .map(c => ({
                name: c.name,
                tag: c.tag,
                medals: c[score],
                attacksUsedToday: c.participants.reduce((a, b) => a + b.decksUsedToday, 0)
            }));

        const battleDaysCompleted = () => {
            if ((rr.periodIndex - rr.periodLogs[rr.periodLogs.length - 1].periodIndex) <= 4) return 0;
            else return rr.periodIndex - rr.periodLogs[rr.periodLogs.length - 1].periodIndex - 4;
        }
        const avgFame = c => {
            if (isCololsseum) {
                if (c.attacksUsedToday === 0 && battleDaysCompleted() === 0) return '0.0';
                return (c.medals / (c.attacksUsedToday + (200 * battleDaysCompleted()))).toFixed(1);
            }
            else {
                if (c.attacksUsedToday === 0) return '0.0';
                return (c.medals / c.attacksUsedToday).toFixed(1);
            }
        }

        const desc = () => {
            let str = ``;

            for (let i = 0; i < clans.length; i++) {
                const c = clans[i];

                if (c.tag === clanTag)
                    str += `__**${i + 1}. ${c.name}**__\n<:fame:807475879215104020> **${c.medals}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nAvg. Fame: **${avgFame(c)}**\n\n`;
                else
                    str += `**${i + 1}. ${c.name}**\n<:fame:807475879215104020> **${c.medals}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nAvg. Fame: **${avgFame(c)}**\n\n`;
            }

            return str;
        }

        const raceEmbed = {
            color: color,
            title: `__Current River Race__`,
            description: desc(),
            thumbnail: {
                url: 'https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest?cb=20180425130200'
            },
            footer: {
                text: (isCololsseum) ? 'Missed attacks negatively affect avg. fame' : ''
            }
        }

        message.channel.send({ embed: raceEmbed });
    }
}