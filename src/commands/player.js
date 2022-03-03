const { getPlayer, getClan } = require("../util/api");
const { orange, pink } = require('../static/colors');
const { getClanBadge, getEmoji, getArenaEmoji, formatTag } = require("../util/functions");

module.exports = {
    data: {
        name: 'player',
        description: 'View player stats.',
        options: [
            {
                type: 3,
                name: 'tag',
                description: '#PLAYERTAG',
                required: false
            },
            {
                type: 6,
                name: 'user',
                description: 'User to view.',
                required: false
            }
        ]
    },
    run: async (i, db, client) => {
        const linkedAccounts = db.collection('Linked Accounts');

        const user = i.options.getUser('user');
        const iTag = i.options.getString('tag');
        let tag;

        if (!user && !iTag) { //linked account
            const linkedAccount = await linkedAccounts.findOne({ discordID: i.user.id });

            if (linkedAccount?.tag) tag = linkedAccount.tag;
            else return await i.editReply({ embeds: [{ color: orange, description: `**No tag linked!**` }], ephemeral: true });
        }
        else if (iTag) tag = iTag; //tag
        else { //user
            const linkedAccount = await linkedAccounts.findOne({ discordID: user.id });

            if (linkedAccount?.tag) tag = linkedAccount.tag;
            else return await i.editReply({ embeds: [{ color: orange, description: `<@!${user.id}> **does not have an account linked.**` }], ephemeral: true });
        }

        const player = await getPlayer(tag).catch(async e => {
            if (e?.response?.status === 404) throw '**Player not found.**';

            return e?.response?.statusText || 'Unexpected Error.';
        });

        let clanBadge;

        if (!player.clan) {
            player.clan = { name: 'None' };
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

        const embed = {
            color: pink,
            url: `https://royaleapi.com/player/${formatTag(tag).substr(1)}`,
            title: `${levelEmoji} **${player.name}**`,
            description: ``
        }

        embed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n${badgeEmoji} **${player.clan.name}**\n\n`; //clan & ladder
        embed.description += `**__Stats__**\n**CW1 War Wins**: ${player.warDayWins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n`; //stats
        embed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}`; //cards

        return await i.editReply({ embeds: [embed] });
    },
};
