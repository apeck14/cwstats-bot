const { getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');
const ChartDataLabels = require('chartjs-plugin-datalabels');
const { red, hexToRgbA, average, orange } = require("../util/otherUtil");

module.exports = {
    name: 'stats',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("General");
        const guilds = db.collection("Guilds");
        const players = db.collection('Players');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix, color, clanTag } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) {
            const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });

            if (linkedAccount) arg = linkedAccount.tag;
            else if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!** To use without a tag, you must link your ID.\n\n__Usage:__\n\`${prefix}stats #ABC123\`` } });
        }

        arg = arg.toUpperCase();
        if (arg[0] !== '#') arg = '#' + arg;

        const player = await players.findOne({ tag: arg });
        if (!player) return message.channel.send({ embed: { color: red, description: '**Player not found.**' } });
        if(player.fameTotals.length === 0) return message.channel.send({ embed: { color: orange, description: '**Player has no data.**' } });

        player.fameTotals = player.fameTotals.filter(w => w.clanTag === clanTag); //remove all weeks from different clans

        player.fameTotals.sort((a, b) => { //sort by date
            a = new Date(a.date);
            b = new Date(b.date);

            return a - b;
        });

        const chart = {
            type: 'line',
            data: {
                labels: (player.fameTotals.length === 0) ? '' : player.fameTotals.map(w => w.date),
                datasets: [
                    {
                        label: 'Fame',
                        data: player.fameTotals.map(w => w.fame),
                        borderColor: color,
                        backgroundColor: hexToRgbA(color),
                        fill: true,
                        datalabels: {
                            display: true,
                            formatter: function (fame, chart_obj) {
                                return `${fame}\n(${player.fameTotals[chart_obj.dataIndex].clanTrophies})`;
                            }
                        }
                    }
                ]
            },
            plugins: [ChartDataLabels],
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 200,
                            color: "white"
                        },
                        suggestedMin: 1600,
                        suggestedMax: 3600,
                        offset: true
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
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
                        labels: {
                            color: "white"
                        }
                    },
                    datalabels: {
                        color: 'white',
                        align: 'end',
                        offset: 4,
                        font: {
                            //weight: 'bold',
                            size: 11
                        }
                    }
                }
            }
        }

        const width = 500;
        const height = 300;
        const canvas = new CanvasRenderService(width, height);
        const image = await canvas.renderToBuffer(chart);

        const memberTags = await getMembers(clanTag, true);
        const memberStats = await players.find({ tag: { $in: memberTags }, 'fameTotals.0': { $exists: true } }).toArray(); //members in clan currently, and have atleast 1 fame score in arr

        const leaderboard = memberStats.map(p => ({ name: p.name, tag: p.tag, avgFame: average(p.fameTotals.filter(w => w.clanTag === clanTag).map(w => w.fame)) })).filter(p => p.avgFame !== 'NaN').sort((a, b) => b.avgFame - a.avgFame);

        const clanRank = leaderboard.findIndex(p => p.tag === player.tag) + 1;
        const avgFame = leaderboard.find(p => p.tag === arg).avgFame;

        let desc = `Avg. Fame: **${avgFame}**\nClan Rank: **${clanRank}**/${leaderboard.length}`;

        message.channel.send({
            embed: {
                color: color,
                title: `__${player.name}'s Stats__`,
                description: desc,
                image: {
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