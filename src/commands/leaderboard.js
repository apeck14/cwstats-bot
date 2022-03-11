const { pink, orange } = require('../static/colors');
const { getEmoji, getClanBadge } = require('../util/functions');

module.exports = {
    data: {
        name: 'leaderboard',
        description: 'View current avg. fame leaderboard from top 100 global clans.'
    },
    run: async (i, db, client) => {
        const dailyLb = db.collection('Daily Clan Leaderboard');
        const top10Clans = await dailyLb.find().sort({ fameAvg: -1 }).limit(10).toArray();

        if (top10Clans.length === 0)
            return i.editReply({
                embeds: [{
                    color: orange,
                    description: '**No data to show!** Try again when war has begun!'
                }]
            })

        const now = new Date();
        const minutes = now.getUTCMinutes();
        const lastUpdatedMins = (minutes > 30) ? minutes - 30 : minutes;

        const embed = {
            title: '**__Global War Leaderboard__**',
            description: '',
            footer: {
                text: `Last Updated: ${lastUpdatedMins}m ago`
            },
            thumbnail: {
                url: 'https://i.imgur.com/VAPR8Jq.png'
            },
            color: pink
        }

        const fameAvgEmoji = getEmoji(client, 'fameAvg');
        const decksRemainingEmoji = getEmoji(client, 'decksRemaining');

        for (let i = 0; i < top10Clans.length; i++) {
            const clan = top10Clans[i];
            const url = `https://www.cwstats.com/clans/${clan.tag.substring(1)}/riverrace`
            const badgeName = getClanBadge(clan.badgeId, clan.clanScore);
            const badgeEmoji = getEmoji(client, badgeName);

            embed.description += `**${i + 1}. ${badgeEmoji} [${clan.name}](${url})**\n`
            embed.description += `${fameAvgEmoji} **${clan.fameAvg.toFixed(1)}** ${decksRemainingEmoji} ${clan.decksRemaining} :earth_americas: #${clan.rank}\n`;
        }

        return i.editReply({ embeds: [embed] });
    }
};
