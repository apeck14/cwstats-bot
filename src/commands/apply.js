const { getPlayer, getClan } = require("../util/api");
const { red, pink, green } = require('../static/colors');
const { getClanBadge, getEmoji, getArenaEmoji, formatTag } = require("../util/functions");

module.exports = {
    data: {
        name: 'apply',
        description: 'Apply to join the clan.',
        options: [
            {
                type: 3,
                name: 'tag',
                description: '#PLAYERTAG',
                required: true
            }
        ]
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');
        const { channels } = await guilds.findOne({ guildID: i.channel.guild.id });
        const { applicationsChannelID } = channels;

        let tag = i.options.getString('tag');

        const player = await getPlayer(tag).catch((e) => {
            if (e?.response?.status === 404) return i.reply({ embeds: [{ description: '**Player not found.**', color: red }], ephemeral: true });

            return i.reply({ embeds: [{ description: e?.response?.statusText || 'Unexpected Error.', color: red }], ephemeral: true });
        });

        if (!player) return;

        let clanBadge;

        if (!player.clan?.name) {
            player.clan.name = 'None';
            clanBadge = getClanBadge(-1);
        }
        else { //get clan badge
            const clan = await getClan(player.clan.tag);
            clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies);
        }

        const badgeEmoji = getEmoji(client, clanBadge);
        const levelEmoji = getEmoji(client, `level${player.expLevel}`);
        const ladderEmoji = getEmoji(client, getArenaEmoji(player.trophies));
        const pbEmoji = getEmoji(client, getArenaEmoji(player.bestTrophies));
        const level14 = getEmoji(client, 'level14c');
        const level13 = getEmoji(client, `level13`);
        const level12 = getEmoji(client, `level12`);
        const level11 = getEmoji(client, `level11`);

        const ccWins = player.badges.find(b => b.name === "Classic12Wins")?.progress || 0;
        const gcWins = player.badges.find(b => b.name === "Grand12Wins")?.progress || 0;
        const lvl14Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
        const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
        const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;
        const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 3).length;

        const applicationEmbed = {
            color: pink,
            title: '__New Application!__',
            description: ``
        }

        applicationEmbed.description += `${levelEmoji} [**${player.name}**](https://royaleapi.com/player/${formatTag(tag).substr(1)})\n`;
        applicationEmbed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n${badgeEmoji} **${player.clan.name}**\n\n`; //clan & ladder
        applicationEmbed.description += `**__Stats__**\n**CW1 War Wins**: ${player.warDayWins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n`; //stats
        applicationEmbed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}`; //cards

        i.reply({
            embeds: [{
                color: green,
                description: `✅ Request sent for **${player.name}**! A Co-Leader will contact you shortly.`
            }]
        });

        return client.channels.cache.get(applicationsChannelID).send({ embeds: [applicationEmbed] });
    },
};
