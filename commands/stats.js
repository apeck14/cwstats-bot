const { getMembers } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');
const ChartDataLabels = require('chartjs-plugin-datalabels');
const { red, hexToRgbA, average, orange } = require("../util/otherUtil");
const { groupBy } = require("lodash");

module.exports = {
    name: 'stats',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("General");
        const guilds = db.collection("Guilds");
        const matches = db.collection('Matches');
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

        const playerMatches = await matches.find({ tag: arg, clanTag: clanTag }).toArray();
        if(playerMatches.length === 0) return message.channel.send({ embed: { color: orange, description: '**Player has no data available.**' } });

        playerMatches.sort((a, b) => { //sort by date
            a = new Date(a.date);
            b = new Date(b.date);

            return a - b;
        });

        const chart = {
            type: 'line',
            data: {
                labels: (playerMatches.length === 0) ? '' : playerMatches.map(w => w.date),
                datasets: [
                    {
                        label: 'Fame',
                        data: playerMatches.map(w => w.fame),
                        borderColor: color,
                        backgroundColor: hexToRgbA(color),
                        fill: true,
                        datalabels: {
                            display: true,
                            formatter: function (fame, chart_obj) {
                                return `${fame}\n(${playerMatches[chart_obj.dataIndex].clanTrophies})`;
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
        const memberMatches = await matches.find({ tag: { $in: memberTags }, clanTag: clanTag }).toArray(); //members in clan currently

        const groupedMatches = groupBy(memberMatches, 'tag');

        const leaderboard = []; //hold all average fames

        for (const tag in groupedMatches) { //loop through collection
            const weeks = groupedMatches[tag];

            leaderboard.push(
                {
                    name: weeks[weeks.length - 1].name,
                    tag: weeks[0].tag,
                    totalWeeks: weeks.length,
                    avgFame: average(weeks.map(m => m.fame))
                }
            )
        }

        leaderboard.sort((a, b) => { //sort by fame, if tied then total matches
            if (a.avgFame === b.avgFame) return b.totalWeeks - a.totalWeeks;
            return b.avgFame - a.avgFame;
        });

        const clanRank = leaderboard.findIndex(p => p.tag === arg) + 1;
        const { avgFame, name } = leaderboard[clanRank - 1];

        let desc = `Avg. Fame: **${avgFame}**\nClan Rank: **${clanRank}**/${leaderboard.length}`;

        message.channel.send({
            embed: {
                color: color,
                title: `__${name}'s Stats__`,
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