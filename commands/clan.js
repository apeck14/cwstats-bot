const { CanvasRenderService } = require("chartjs-node-canvas");
const { ApiRequest } = require("../functions/api");
const { hexToRgbA, getEmoji, average, getClanBadge, formatTag } = require("../functions/util");
const { pink, orange } = require("../data/colors");

module.exports = {
    name: 'clan',
    aliases: ['clan', 'c'],
    description: 'View any clan\'s war stats',
    parameters: ['1-3', '#TAG'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        const { channels, color, clans, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const { tag1, tag2, tag3 } = clans;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tag, embedColor;

        if (!args[0] || args[0] === '1') {
            if (!tag1) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan1 #ABC123\`\`\``;
            tag = tag1;
            embedColor = color;
        }
        else if (args[0] === '2') {
            if (!tag2) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan2 #ABC123\`\`\``;
            tag = tag2;
            embedColor = color;
        }
        else if (args[0] === '3') {
            if (!tag3) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan3 #ABC123\`\`\``;
            tag = tag3;
            embedColor = color;
        }
        else {
            tag = '#' + formatTag(args[0]);
            embedColor = pink;
        }

        const clan = await ApiRequest('', tag, 'clans')
            .catch((e) => {
                if (e.response?.status === 404) message.channel.send({ embed: { description: '**Clan is not in a river race, or invalid tag.**', color: orange } });
            });
        if (!clan) return;

        const log = await ApiRequest('riverracelog', tag)
            .catch((e) => {
                if (e.response?.status === 404) message.channel.send({ embed: { description: '**Clan is not in a river race, or invalid tag.**', color: orange } });
            });
        if (!log) return;

        const fameTotals = log.map(w => w.standings.find(c => c.clan.tag === tag).clan.participants.reduce((a, b) => a + b.fame, 0));

        const graph = {
            type: 'line',
            data: {
                labels: log.map(() => ' '),
                datasets: [
                    {
                        label: 'Fame',
                        data: fameTotals.reverse(),
                        borderColor: embedColor,
                        backgroundColor: hexToRgbA(embedColor),
                        fill: true
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 15000,
                            color: "white",
                            font: {
                                size: 30
                            }
                        },
                        suggestedMin: 0,
                        suggestedMax: 180000,
                        offset: true
                    }
                },
                layout: {
                    padding: {
                        left: 15,
                        right: 15
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }

        const width = 900;
        const height = 600;
        const canvas = new CanvasRenderService(width, height);
        const image = await canvas.renderToBuffer(graph);

        const max = (fameTotals.length === 0) ? 'N/A' : Math.max(...fameTotals);
        const min = (fameTotals.length === 0) ? 'N/A' : Math.min(...fameTotals);
        const avg = (fameTotals.length === 0) ? 'N/A' : average(fameTotals).toFixed(0);
        const fameEmoji = getEmoji(bot, 'fame');

        const desc = `${getEmoji(bot, 'clanScore')} **${clan.clanScore}**\n${getEmoji(bot, 'cwtrophy')} **${clan.clanWarTrophies}**\n${getEmoji(bot, 'members')} **${clan.members}** / 50`;
        const warStats = `\n\n__**War Stats**__\nMax: ${fameEmoji}**${max}**\nMin: ${fameEmoji}**${min}**\nAvg.: ${fameEmoji}**${avg}**`;

        return message.channel.send({
            embed: {
                color: embedColor,
                title: `__${clan.name}__ (${clan.tag})`,
                description: desc + warStats,
                thumbnail: {
                    url: 'attachment://badge.png'
                },
                image: {
                    url: 'attachment://graph.png'
                },
                files: [
                    {
                        attachment: image,
                        name: 'graph.png'
                    },
                    {
                        attachment: `./allBadges/${getClanBadge(clan.badgeId, clan.clanWarTrophies, false)}.png`,
                        name: 'badge.png'
                    }
                ]
            }
        })
    }
}