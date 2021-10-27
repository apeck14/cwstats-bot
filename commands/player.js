const { ApiRequest } = require("../functions/api");
const { getClanBadge, hexToRgbA, getEmoji, getArenaEmoji, formatTag } = require("../functions/util");
const { pbRating, cardsRating, challRating, cw1Rating } = require("../functions/ratings");
const { CanvasRenderService } = require("chartjs-node-canvas");
const { orange } = require("../data/colors");

module.exports = {
    name: 'player',
    aliases: ['player', 'p', 'playa'],
    description: 'View general info of any player',
    parameters: ['#TAG', '@USER'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tag;

        if (!args[0]) {
            const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });

            if (!linkedAccount?.tag)
                return message.channel.send({ embed: { color: orange, description: `**No tag linked!**\n\n__Usage:__\n\`${prefix}link #ABC123\`` } });

            tag = linkedAccount.tag;
        }
        else if (args[0].startsWith('<@')) {
            const id = args[0].replace(/[^0-9]/g, '');
            const linkedAccount = await linkedAccounts.findOne({ discordID: id });

            if (!linkedAccount) return message.channel.send({ embed: { color: orange, description: `<@!${id}> **does not have an account linked.**` } });
            tag = linkedAccount.tag;
        }
        else tag = args[0];

        const player = await ApiRequest('', tag, 'players')
            .catch((e) => {
                if (e.response?.status === 404) throw '**Invalid tag.** Try again.';
            });

        let clanBadge;

        if (!player.clan?.name) {
            player.clan.name = 'None';
            clanBadge = getClanBadge(-1);
        }
        else { //get clan badge
            const clan = await ApiRequest('', player.clan.tag, 'clans');
            clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies);
        }

        const chart = {
            type: 'radar',
            data: {
                labels: ['PB', 'Cards', 'Challs', 'CW1'],
                datasets: [{
                    data: [pbRating(player), cardsRating(player), challRating(player), cw1Rating(player)],
                    borderColor: color,
                    backgroundColor: hexToRgbA(color)
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            color: 'gray'
                        },
                        ticks: {
                            stepSize: 20,
                            display: false
                        },
                        pointLabels: {
                            font: {
                                size: 22,
                                color: 'white',
                                weight: 800
                            }
                        },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }

        const width = 300;
        const height = 300;
        const canvas = new CanvasRenderService(width, height);
        const image = await canvas.renderToBuffer(chart);

        const badgeEmoji = getEmoji(bot, clanBadge);
        const levelEmoji = getEmoji(bot, `level${player.level}`);
        const pbEmoji = getEmoji(bot, getArenaEmoji(player.pb));
        const level14 = getEmoji(bot, 'level14c');
        const level13 = getEmoji(bot, `level13`);
        const level12 = getEmoji(bot, `level12`);
        const level11 = getEmoji(bot, `level11`);

        const desc = () => {
            const lvl14Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
            const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
            const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;
            const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 3).length;

            const top = `${badgeEmoji} **${player.clan.name}**\n\n`;
            const mid = `**__Stats__**\n**PB**: ${pbEmoji} ${player.pb}\n**CW1 War Wins**: ${player.warWins}\n**Most Chall. Wins**: ${player.mostChallWins}\n**CC Wins**: ${player.challWins}\n**GC Wins**: ${player.grandChallWins}\n\n`;
            const bottom = `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}\n\n[RoyaleAPI Profile](https://royaleapi.com/player/${formatTag(tag)})`;
            return top + mid + bottom;
        }

        return message.channel.send({
            embed: {
                color: color,
                title: `${levelEmoji} ${player.name} (${player.tag})`,
                description: desc(),
                thumbnail: {
                    url: 'attachment://chart.png'
                },
                files: [{
                    attachment: image,
                    name: 'chart.png'
                }]
            }
        });
    }
}