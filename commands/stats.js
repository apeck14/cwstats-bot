const { getMembers, getClanBadge, getPlayerData } = require("../util/clanUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');
const { red, hexToRgbA, orange, request } = require("../util/otherUtil");
const { groupBy } = require("lodash");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { MessageAttachment } = require("discord.js");
registerFont('./fonts/Supercell-Magic_5.ttf', { family: 'Supercell-Magic' });

module.exports = {
    name: 'stats',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const linkedAccounts = db.collection('Linked Accounts');
        const matches = db.collection('Matches');

        const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) {
            const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });

            if (linkedAccount) arg = linkedAccount.tag;
            else if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!** To use without a tag, you must link your ID.\n\n__Usage:__\n\`${prefix}stats #ABC123\`\n\`${prefix}link #ABC123\`` } });
        }
        else if (arg.indexOf('<@') === 0) { //@ing someone with linked account
            const playerId = arg.replace(/[^0-9]/g, '');
            const linkedPlayer = await linkedAccounts.findOne({ discordID: playerId });

            if (!linkedPlayer) return message.channel.send({ embed: { color: orange, description: `<@!${playerId}> **does not have an account linked.**` } });
            arg = linkedPlayer.tag;
        }

        arg = arg.toUpperCase().replace('O', '0');
        if (arg[0] !== '#') arg = '#' + arg;

        const player = await getPlayerData(arg)

        const allMatches = await matches.find({}).toArray();
        const allMatchesGrouped = groupBy(allMatches, 'tag');

        if (!allMatchesGrouped[arg] || allMatchesGrouped[arg].length === 0) return message.channel.send({ embed: { color: orange, description: '**Player has no data.**' } });

        const clanMembers = await getMembers(player.clanTag, true); //current clan members' tags

        function avgFame(matches, weeks) { //matches needs to be pre-sorted by date if not total avg
            const indeces = (matches.length < weeks) ? matches.length : weeks;
            let sum = 0;

            for (let i = 0; i < indeces; i++) {
                sum += matches[i].fame;
            }

            return sum / indeces;
        }

        function sortByDateDescending(arr) {
            return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const globalLb = []; // {'tag': '', 'totalAvgFame': 0, totalWeeks: 0}
        const clanLb = []; // {'tag': '', 'totalAvgFame': 0, totalWeeks: 0}

        for (const t in allMatchesGrouped) { //push players to global and clan lb
            const p = { tag: allMatchesGrouped[t][0].tag, totalAvgFame: avgFame(allMatchesGrouped[t], allMatchesGrouped[t].length), totalWeeks: allMatchesGrouped[t].length };

            if (p.tag === arg) sortByDateDescending(allMatchesGrouped[t]);

            globalLb.push(p);
            if (clanMembers.includes(p.tag)) clanLb.push(p);
        }

        //sort leaderboards
        globalLb.sort((a, b) => {
            if (a.totalAvgFame === b.totalAvgFame) return b.totalWeeks - a.totalWeeks;
            return b.totalAvgFame - a.totalAvgFame;
        });
        clanLb.sort((a, b) => {
            if (a.totalAvgFame === b.totalAvgFame) return b.totalWeeks - a.totalWeeks;
            return b.totalAvgFame - a.totalAvgFame;
        });

        const playerStats = {
            avgFame: {
                last2Weeks: avgFame(allMatchesGrouped[arg], 2),
                last4Weeks: avgFame(allMatchesGrouped[arg], 4),
                last8Weeks: avgFame(allMatchesGrouped[arg], 8),
                total: avgFame(allMatchesGrouped[arg], allMatchesGrouped[arg].length)
            },
            rankings: {
                global: globalLb.findIndex(p => p.tag === arg) + 1,
                clan: clanLb.findIndex(p => p.tag === arg) + 1
            }
        }

        if (playerStats.rankings.clan === 0) playerStats.rankings.clan === 'N/A'; // not in clan

        const image = await loadImage('./overlay.png');
        const canvas = createCanvas(image.width, image.height); //2130 x 1530
        const context = canvas.getContext('2d');

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // NAME and TAG ----------------------
        let tagWidth, nameWidth;
        for (let i = 85; i >= 20; i -= 5) {
            context.font = `35px Supercell-Magic`;
            tagWidth = context.measureText(arg).width;

            context.font = `${i}px Supercell-Magic`;
            nameWidth = context.measureText(player.name).width;

            if ((nameWidth + 15 + tagWidth) <= 900) break;
        }

        context.fillStyle = 'white';

        const nameCoords = {
            x: 1140 + ((900 - (nameWidth + 15 + tagWidth)) / 2),
            y: 155
        }
        const tagCoords = {
            x: nameCoords.x + context.measureText(player.name).width + 15,
            y: 155
        }

        context.fillText(player.name, nameCoords.x, nameCoords.y);

        context.font = `35px Supercell-Magic`;
        context.fillStyle = '#958f99';
        context.fillText(arg, tagCoords.x, tagCoords.y);

        // CLAN BADGE and CLAN NAME ----------------------
        context.font = `30px Supercell-Magic`;
        const clanNameWidth = context.measureText(player.clan).width;
        context.fillStyle = 'white';
        const clanBadgeCoords = {
            x: 1090 + ((1000 - (80 + 5 + clanNameWidth)) / 2),
            y: 168
        }
        const clanNameCoords = {
            x: clanBadgeCoords.x + 80 + 5,
            y: 220
        }

        let clanBadge;
        if (player.clanTag) {
            const { badgeId, clanWarTrophies } = await request(`https://proxy.royaleapi.dev/v1/clans/%23${player.clanTag.substr(1)}`, true);
            clanBadge = await loadImage(`./allBadges/${getClanBadge(badgeId, clanWarTrophies, false)}.png`);
        }
        else {
            clanBadge = await loadImage(`./allBadges/no_clan.png`);
            player.clan = 'None';
            playerStats.rankings.clan = 'N/A';
        }

        context.drawImage(clanBadge, clanBadgeCoords.x, clanBadgeCoords.y, 80, 80);
        context.fillText(player.clan, clanNameCoords.x, clanNameCoords.y);

        // TABLE DATA --------------------------------
        context.font = `40px Supercell-Magic`;

        const tableCoords = {
            date: {
                x: 190,
                y: 330
            },
            clanWarTrophies: {
                x: (trophies) => {
                    return 532 + ((220 - context.measureText(trophies).width) / 2)
                },
                y: 330
            },
            fame: {
                x: (score) => {
                    return 763 + ((206 - context.measureText(score).width) / 2);
                },
                y: 330
            }
        }

        const weeklyFameTotals = allMatchesGrouped[arg].map(w => w.fame);
        const min = Math.min(...weeklyFameTotals);
        const max = Math.max(...weeklyFameTotals);

        const indeces = (allMatchesGrouped[arg].length < 15) ? allMatchesGrouped[arg].length : 15;

        for (let i = 0; i < indeces; i++) {
            context.fillStyle = '#8fb5dc';
            const week = allMatchesGrouped[arg][i];

            context.fillText(week.date, tableCoords.date.x, tableCoords.date.y);

            context.fillStyle = '#958f99';
            context.fillText(week.clanTrophies, tableCoords.clanWarTrophies.x(week.clanTrophies), tableCoords.clanWarTrophies.y);

            if (week.fame === min && min !== max) context.fillStyle = '#ff0000';
            else if (week.fame === max && min !== max) context.fillStyle = '#32cd32';

            context.fillText(week.fame, tableCoords.fame.x(week.fame), tableCoords.fame.y);

            tableCoords.date.y += 75.8;
            tableCoords.clanWarTrophies.y += 75.8;
            tableCoords.fame.y += 75.8;
        }

        //AVERAGE MEDALS and WAR RANKINGS ---------------------------------
        context.fillStyle = '#ed3689'; //pink

        context.font = `44px Supercell-Magic`;
        context.fillText(playerStats.avgFame.total.toFixed(0), 1725, 1120);

        context.font = `35px Supercell-Magic`;
        context.fillText(playerStats.avgFame.last2Weeks.toFixed(0), 1379, 1058);
        context.fillText(playerStats.avgFame.last4Weeks.toFixed(0), 1838, 1058);
        context.fillText(playerStats.avgFame.last8Weeks.toFixed(0), 1383, 1108);

        context.fillText(`${playerStats.rankings.global} / ${globalLb.length}`, 1480, 1286);
        context.fillText(playerStats.rankings.clan, 1340, 1339);

        //GRAPH -----------------------------------------
        const chart = {
            type: 'line',
            data: {
                labels: weeklyFameTotals.slice(0, indeces).map(w => ' '),
                datasets: [
                    {
                        label: 'Fame',
                        data: weeklyFameTotals.reverse(),
                        borderColor: '#ff237a',
                        backgroundColor: hexToRgbA('#ff237a'),
                        fill: true
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            stepSize: 200,
                            color: "white",
                            font: {
                                size: 30
                            }
                        },
                        suggestedMin: 1600,
                        suggestedMax: 3600,
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

        const width = 960;
        const height = 680;
        const chartCanvas = new CanvasRenderService(width, height);
        const chartBuffer = await chartCanvas.renderToBuffer(chart);

        const chartImg = await loadImage(chartBuffer);
        context.drawImage(chartImg, 1052, 240, chartImg.width, chartImg.height);

        return message.channel.send(new MessageAttachment(canvas.toBuffer(), 'image.png'));

    }
}