const { getRiverRace } = require("../util/api");
const { orange, red, pink } = require('../static/colors');
const { getRacePlacements, getAvgFame, getProjFame } = require("../util/raceFunctions");
const { getClanBadge, getEmoji } = require("../util/functions");

module.exports = {
    data: {
        name: 'race',
        description: 'View river race stats & projections.',
        options: [
            {
                type: 3, //https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
                name: 'tag',
                description: '#CLANTAG or abbreviation',
                required: true
            }
        ]
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');
        const { abbreviations } = await guilds.findOne({ guildID: i.channel.guild.id });

        let tag = i.options.getString('tag');
        const abbr = abbreviations?.find(a => a.abbr === tag);

        if (abbr) tag = abbr.tag;

        const race = await getRiverRace(tag).catch((e) => {
            if (e?.response?.status === 404) return i.editReply({ embeds: [{ description: '**Clan not found.**', color: red }], ephemeral: true });

            return i.editReply({ embeds: [{ description: e?.response?.statusText || 'Unexpected Error.', color: red }], ephemeral: true });
        });

        if (!race) return;
        if (race.state === 'matchmaking') return i.editReply({ embeds: [{ description: ':mag: **Matchmaking is underway!**', color: orange }] });
        if (!race.clans || race.clans.length <= 1) return i.editReply({ embeds: [{ description: '**Clan is not in a river race.**', color: orange }] });

        const isColosseum = race.periodType === "colosseum";
        const dayOfWeek = race.periodIndex % 7; // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

        const embed = {
            color: pink,
            title: (isColosseum) ? `**__Colosseum__**` : `**__River Race__**`,
            description: '',
            thumbnail: {
                url: 'https://i.imgur.com/VAPR8Jq.png'
            },
            footer: {
                text: (isColosseum) ? 'Missed attacks negatively affect fame/atk' : ''
            },
            author: {
                name: `Week ${race.sectionIndex + 1} | ${(dayOfWeek < 3) ? 'Training' : 'War'} Day ${(dayOfWeek < 3) ? dayOfWeek + 1 : dayOfWeek - 2}`
            }
        }

        const placements = await getRacePlacements(race.clans, isColosseum);

        for (const c of placements) {
            embed.description += `${(c.placement === Infinity) ? '' : `**${c.placement}.**`}` //placement

            const clan = race.clans.find(cl => cl.tag === c.tag);
            const { name, badgeId, clanScore, participants } = clan;

            const decksRemaining = 200 - participants.reduce((a, b) => a + b.decksUsedToday, 0);

            const badgeName = getClanBadge(badgeId, clanScore);
            const badgeEmoji = getEmoji(client, badgeName);
            const fameEmoji = getEmoji(client, 'fame');
            const fameAvgEmoji = getEmoji(client, 'fameAvg');
            const decksRemainingEmoji = getEmoji(client, 'decksRemaining');
            const projectionEmoji = getEmoji(client, 'projection');

            if (c.tag === race.clan.tag) embed.description += `${badgeEmoji} **__${name}__**\n`
            else embed.description += `${badgeEmoji} **${name}**\n`;

            embed.description += `${fameEmoji} ${c.fame}\n${projectionEmoji} ${getProjFame(clan, isColosseum, dayOfWeek)}\n${decksRemainingEmoji} ${decksRemaining}\n${fameAvgEmoji} **${getAvgFame(clan, isColosseum, dayOfWeek).toFixed(1)}**\n\n`;
        }

        return i.editReply({ embeds: [embed] });
    },
};
