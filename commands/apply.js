const { ApiRequest } = require('../functions/api');
const { CanvasRenderService } = require('chartjs-node-canvas');
const { getClanBadge, hexToRgbA, getEmoji, getArenaEmoji, formatTag } = require("../functions/util");
const { pbRating, cardsRating, challRating, cw1Rating } = require('../functions/ratings');
const { green } = require('../data/colors');

module.exports = {
    name: 'apply',
    aliases: ['apply'],
    description: `Allow for newcomers to apply through Discord`,
    parameters: ['#TAG'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        const { channels, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { applyChannelID, applicationsChannelID } = channels;

        if (applyChannelID && applyChannelID !== message.channel.id) throw `You can only use this command in the set **apply channel**! (<#${applyChannelID}>)`;
        else if (!bot.channels.cache.has(applicationsChannelID)) throw `**Applications channel** not set!`;
        else if (!args[0]) throw `**No tag given!**\n\n__Usage:__\n\`${prefix}apply #ABC123\``;

        //make sure bot has permissions in Applications channel
        const applicationsChannelPermissions = bot.channels.cache.get(applicationsChannelID).permissionsFor(bot.user);
        const requiredPerms = ['ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'SEND_MESSAGES', 'USE_EXTERNAL_EMOJIS', 'VIEW_CHANNEL'];
        const missingPerms = requiredPerms.filter(p => !applicationsChannelPermissions.has(p));

        if (missingPerms.length > 0)
            throw `🚨 **__Missing Permissions__** in <#${applicationsChannelID}>: 🚨\n${missingPerms.map(p => `\n• **${p.replace(/_/g, ' ')}**`).join('')}`;

        const player = await ApiRequest('', args[0], 'players')
            .catch((e) => {
                if (e.response.status === 404) throw '**Invalid tag.** Try again.';
            });

        if (!player) return;

        let clanBadge;

        if (!player.clan?.name) {
            player.clan.name = 'None';
            clanBadge = getClanBadge(-1);
        }
        else { //get clan badge
            const { badgeId, clanWarTrophies } = await ApiRequest('', player.clan.tag, 'clans');
            clanBadge = getClanBadge(badgeId, clanWarTrophies);
        }

        const radarGraph = {
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
        const image = await canvas.renderToBuffer(radarGraph);

        const userMention = `<@!${message.author.id}>`;
        const level14 = getEmoji(bot, 'level14c');
        const level13 = getEmoji(bot, 'level13');
        const level12 = getEmoji(bot, 'level12');
        const level11 = getEmoji(bot, 'level11');

        const desc = () => {
            const lvl14Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
            const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
            const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;
            const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 3).length;

            const top = `${getEmoji(bot, `level${player.level}`)} **${player.name}**\n${player.tag}\n${getEmoji(bot, clanBadge)} **${player.clan.name}**\n\n`;
            const mid = `**__Stats__**\n**PB**: ${getEmoji(bot, getArenaEmoji(player.pb))} ${player.pb}\n**CW1 War Wins**: ${player.warWins}\n**Most Chall. Wins**: ${player.mostChallWins}\n**CC Wins**: ${player.challWins}\n**GC Wins**: ${player.grandChallWins}\n\n`;
            const bottom = `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}\n\n[RoyaleAPI Profile](https://royaleapi.com/player/${formatTag(args[0])})\n**Request By**: ${userMention}`;
            return top + mid + bottom;
        }

        const applicationEmbed = {
            color: color,
            title: `__New Request!__`,
            thumbnail: {
                url: 'attachment://graph.png'
            },
            description: desc(),
            files: [{
                attachment: image,
                name: 'graph.png'
            }]
        };

        const confirmationEmbed = {
            color: green,
            description: `✅ Request sent for **${player.name}**! A Co-Leader will contact you shortly.`
        };

        message.channel.send({ embed: confirmationEmbed });
        return bot.channels.cache.get(applicationsChannelID).send({ embed: applicationEmbed });
    }
}