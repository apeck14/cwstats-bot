const { getRiverRace, getClan } = require("../util/api");
const { orange, red, pink } = require('../static/colors');
const { getClanBadge, getEmoji } = require("../util/functions");

module.exports = {
    data: {
        name: 'attacks',
        description: 'View remaining attacks.',
        options: [
            {
                type: 3,
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
        const abbr = abbreviations.find(a => a.abbr === tag);

        if (abbr) tag = abbr.tag;

        const race = await getRiverRace(tag).catch((e) => {
            if (e?.response?.status === 404) return i.editReply({ embeds: [{ description: '**Clan not found.**', color: red }], ephemeral: true });

            return i.editReply({ embeds: [{ description: e?.response?.statusText || 'Unexpected Error.', color: red }], ephemeral: true });
        });

        if (!race) return;
        if (race.state === 'matchmaking') return i.editReply({ embeds: [{ description: ':mag: **Matchmaking is underway!**', color: orange }] });
        if (!race.clans || race.clans.length <= 1) return i.editReply({ embeds: [{ description: '**Clan is not in a river race.**', color: orange }] });

        const clan = await getClan(tag).catch((e) => {
            if (e?.response?.status === 404) return i.editReply({ embeds: [{ description: '**Clan not found.**', color: red }], ephemeral: true });

            return i.editReply({ embeds: [{ description: e?.response?.statusText || 'Unexpected Error.', color: red }], ephemeral: true });
        });

        if (!clan) return;

        const dayOfWeek = race.periodIndex % 7; // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

        const isColosseum = race.periodType === "colosseum";
        const fame = (isColosseum) ? race.clan.fame : race.clan.periodPoints;
        const totalAttacksLeft = 200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0);

        const { participants } = race.clan;
        const { memberList, badgeId, clanWarTrophies, name } = clan;

        const fourAttacks = [];
        const threeAttacks = [];
        const twoAttacks = [];
        const oneAttack = [];

        let showFooter = false;

        for (const p of participants) { //push all players to appropiate array
            const inClan = memberList.find(m => m.tag === p.tag);

            if (p.decksUsedToday === 0 && inClan) fourAttacks.push(p);
            else if (p.decksUsedToday === 1) {
                if (!inClan) {
                    p.name += '*';
                    showFooter = true;
                }
                threeAttacks.push(p);
            }
            else if (p.decksUsedToday === 2) {
                if (!inClan) {
                    p.name += '*';
                    showFooter = true;
                }
                twoAttacks.push(p);
            }
            else if (p.decksUsedToday === 3) {
                if (!inClan) {
                    p.name += '*';
                    showFooter = true;
                }
                oneAttack.push(p);
            }
        }

        fourAttacks.sort((a, b) => a.name.localeCompare(b.name));
        threeAttacks.sort((a, b) => a.name.localeCompare(b.name));
        twoAttacks.sort((a, b) => a.name.localeCompare(b.name));
        oneAttack.sort((a, b) => a.name.localeCompare(b.name));

        const embed = {
            color: pink,
            title: `**__Remaining Attacks__**`,
            description: '',
            author: {
                name: `Week ${race.sectionIndex + 1} | ${(dayOfWeek < 3) ? 'Training' : 'War'} Day ${(dayOfWeek < 3) ? dayOfWeek + 1 : dayOfWeek - 2}`
            },
            footer: {
                text: (showFooter) ? `* = Not in clan` : ``
            }
        }

        const badgeName = getClanBadge(badgeId, clanWarTrophies);
        const badgeEmoji = getEmoji(client, badgeName);
        const fameEmoji = getEmoji(client, 'fame');
        const decksRemainingEmoji = getEmoji(client, 'decksRemaining');

        embed.description += `${badgeEmoji} **${name}**\n${fameEmoji} **${fame}**\n${decksRemainingEmoji} **${totalAttacksLeft}**\n`;

        if (fourAttacks.length > 0)
            embed.description += `\n**__4 Attacks__**\n${fourAttacks.map(p => `• ${p.name}\n`).join('')}`;
        if (threeAttacks.length > 0)
            embed.description += `\n**__3 Attacks__**\n${threeAttacks.map(p => `• ${p.name}\n`).join('')}`;
        if (twoAttacks.length > 0)
            embed.description += `\n**__2 Attacks__**\n${twoAttacks.map(p => `• ${p.name}\n`).join('')}`;
        if (oneAttack.length > 0)
            embed.description += `\n**__1 Attack__**\n${oneAttack.map(p => `• ${p.name}\n`).join('')}`;

        return i.editReply({ embeds: [embed] });
    }
};