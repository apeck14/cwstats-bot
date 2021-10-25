const { loadImage, createCanvas, registerFont } = require("canvas");
const { CanvasRenderService } = require("chartjs-node-canvas");
const { MessageAttachment } = require("discord.js");
const { groupBy } = require("lodash");
const { ApiRequest } = require("../functions/api");
const { getClanBadge, hexToRgbA, formatTag } = require("../functions/util");
const { orange } = require("../data/colors");

registerFont('./fonts/Supercell-Magic_5.ttf', { family: 'Supercell-Magic' });

module.exports = {
    name: 'stats',
    aliases: ['stats', 's'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const linkedAccounts = db.collection('Linked Accounts');
        const matches = db.collection('Matches');

        const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
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
        else tag = `#${formatTag(args[0])}`;

        const player = await ApiRequest('', tag, 'players')
            .catch((e) => {
                if (e.response?.status === 404) throw '**Invalid tag.** Try again.';
            });;

        const allMatches = await matches.find({}).toArray();
        const allMatchesGrouped = groupBy(allMatches, 'tag');

        if (!allMatchesGrouped[tag] || allMatchesGrouped[tag].length === 0) return message.channel.send({ embed: { color: orange, description: '**Player has no data.**' } });

        const clanMembers = await ApiRequest('members', player.clan.tag, '', true);

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

            if (p.tag === tag) sortByDateDescending(allMatchesGrouped[t]);

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
                last2Weeks: avgFame(allMatchesGrouped[tag], 2),
                last4Weeks: avgFame(allMatchesGrouped[tag], 4),
                last8Weeks: avgFame(allMatchesGrouped[tag], 8),
                total: avgFame(allMatchesGrouped[tag], allMatchesGrouped[tag].length)
            },
            rankings: {
                global: globalLb.findIndex(p => p.tag === tag) + 1,
                clan: clanLb.findIndex(p => p.tag === tag) + 1
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
            tagWidth = context.measureText(tag).width;

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
        context.fillText(tag, tagCoords.x, tagCoords.y);

        // CLAN BADGE and CLAN NAME ----------------------
        context.font = `30px Supercell-Magic`;
        const clanNameWidth = context.measureText(player.clan.name).width;
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
        if (player.clan.tag) {
            const clan = await ApiRequest('', player.clan.tag, 'clans');
            clanBadge = await loadImage(`./allBadges/${getClanBadge(clan.badgeId, clan.clanWarTrophies, false)}.png`);
        }
        else {
            clanBadge = await loadImage(`./allBadges/no_clan.png`);
            player.clan.name = 'None';
            playerStats.rankings.clan = 'N/A';
        }

        context.drawImage(clanBadge, clanBadgeCoords.x, clanBadgeCoords.y, 80, 80);
        context.fillText(player.clan.name, clanNameCoords.x, clanNameCoords.y);

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

        const weeklyFameTotals = allMatchesGrouped[tag].map(w => w.fame);
        const min = Math.min(...weeklyFameTotals);
        const max = Math.max(...weeklyFameTotals);

        const indeces = (allMatchesGrouped[tag].length < 15) ? allMatchesGrouped[tag].length : 15;

        for (let i = 0; i < indeces; i++) {
            context.fillStyle = '#8fb5dc';
            const week = allMatchesGrouped[tag][i];

            context.fillText(week.date, tableCoords.date.x, tableCoords.date.y);

            context.fillStyle = '#958f99';
            context.fillText(week.clanTrophies, tableCoords.clanWarTrophies.x(week.clanTrophies), tableCoords.clanWarTrophies.y);

            if (week.fame === min && min !== max) context.fillStyle = '#ff0000';
            else if (week.fame === max && min !== max) context.fillStyle = '#32cd32';

            context.fillText(week.fame, tableCoords.fame.x(week.fame), tableCoords.fame.y);

            const lineSpacing = 76.1;

            tableCoords.date.y += lineSpacing;
            tableCoords.clanWarTrophies.y += lineSpacing;
            tableCoords.fame.y += lineSpacing;
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