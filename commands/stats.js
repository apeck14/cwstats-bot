const { getMembers } = require("../util/clanUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');
const { red, hexToRgbA, average, orange } = require("../util/otherUtil");
const { groupBy } = require("lodash");
const { createCanvas, loadImage } = require("canvas");
const { MessageAttachment } = require("discord.js");

module.exports = {
    name: 'stats',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const linkedAccounts = db.collection('Linked Accounts');
        const matches = db.collection('Matches');

        const { channels, prefix, clanTag } = await guilds.findOne({ guildID: message.channel.guild.id });
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

        const allMatches = await matches.find({}).toArray();
        const allMatchesGrouped = groupBy(allMatches, 'tag');

        if(!allMatchesGrouped[arg] || allMatchesGrouped[arg].length === 0) return message.channel.send({ embed: { color: orange, description: '**Player has no data.**' } });

        const clanMembers = await getMembers(clanTag, true); //current clan members' tags

        const clanLb = []; //{tag: '', avgFame: '', totalWeeks: 0}
        const globalLb = []; //{tag: '', avgFame: '', totalWeeks: 0}

        if(clanMembers.indexOf(arg) !== -1) {
            //create clan leaderboard
            for(const t of clanMembers){
                const playerMatches = allMatchesGrouped[t];

                if(playerMatches && playerMatches.length > 0){
                    const playerFameScores = playerMatches.map(w => w.fame);
                    clanLb.push({tag: t, avgFame: average(playerFameScores), totalWeeks: playerMatches.length});
                }
            }
        }

        //create global leaderboard
        for(const t in allMatchesGrouped){
            const playerMatches = allMatchesGrouped[t];

            const playerFameScores = playerMatches.map(w => w.fame);
            globalLb.push({tag: t, avgFame: average(playerFameScores), totalWeeks: playerMatches.length});
        }

        //sort by fame then totalWeeks
        clanLb.sort((a, b) => {
            if (a.avgFame === b.avgFame) return b.totalWeeks - a.totalWeeks;
            return b.avgFame - a.avgFame;
        });

        globalLb.sort((a, b) => {
            if (a.avgFame === b.avgFame) return b.totalWeeks - a.totalWeeks;
            return b.avgFame - a.avgFame;
        });

        const player = {
            avgFame: globalLb.find(p => p.tag === arg).avgFame,
            clanRank: clanLb.findIndex(p => p.tag === arg) + 1,
            globalRank: globalLb.findIndex(p => p.tag === arg) + 1,
            weeks: allMatchesGrouped[arg]
        };

        player.name = player.weeks[player.weeks.length - 1].name;

        //if player not in clan linked to server
        if(clanLb.length === 0) player.clanRank = 'N/A';

        const canvas = createCanvas(450, 320); //2100 x 1500
        const context = canvas.getContext('2d');
        const image = await loadImage('./overlay.jpg');

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        //player name & tag --------------------------------------------------------------------------
        let nameWidth, nameMultiplier, tagWidth;

        for(let i = 110; i >= 10; i -= 5){ //set all name and tag multipliers
            let totalWidth = 0;

            context.font = `${i}px Impact`;
            totalWidth += context.measureText(player.name).width;

            context.font = `50px Impact`;
            totalWidth += context.measureText(arg).width;

            totalWidth += 15;

            if(totalWidth <= 1000){
                context.font = `${i}px Impact`;
                nameWidth = context.measureText(player.name).width;
                nameMultiplier = i;

                context.font = `50px Impact`;
                tagWidth = context.measureText(arg).width;
                break;
            }

        }

        context.font = `${nameMultiplier}px Impact`;
        context.fillStyle = 'white';

        const emptySpace = () => {
            return 1000 - (nameWidth + tagWidth + 15);
        }

        const nameXCoord = () => {
            return 15 + 50 + (emptySpace() / 2);
        }

        context.fillText(player.name, nameXCoord(), 170);

        //player tag
        context.font = '50px Impact';
        context.fillStyle = '#D3D3D3';

        const tagXCoord = () => {
            return nameXCoord() + nameWidth + 15;
        }

        context.fillText(arg, tagXCoord(), 170); //tag

        context.fillStyle = 'white';

        context.fillRect(nameXCoord(), 185, nameWidth + 15 + tagWidth, 10); //underline

        //----------------------------------------------------------------------------------------------
        //clan rank & global rank
        let clanRankWidth, globalRankWidth, clanRankMultiplier, globalRankMultiplier;

        for(let i = 60; i >= 10; i -= 5){ //set clan and global rank multipliers
            context.font = `${i}px Impact`;
            
            const tempClanRankWidth = context.measureText(player.clanRank).width;
            const tempGlobalRankWidth = context.measureText(player.globalRank).width;

            if(!clanRankMultiplier && (tempClanRankWidth + 50) < 265){
                clanRankWidth = tempClanRankWidth;
                clanRankMultiplier = i;
            }
            if(!globalRankMultiplier && (tempGlobalRankWidth + 50) < 265){
                globalRankWidth = tempGlobalRankWidth;
                globalRankMultiplier = i;
            }
        }

        context.font = `${clanRankMultiplier}px Impact`;
        
        const clanRankXCoord = () => {
            return 1130 + ((215 - clanRankWidth) / 2) + 25;
        }

        context.fillText(player.clanRank, clanRankXCoord(), 332);

        context.font = `${globalRankMultiplier}px Impact`;

        const globalRankXCoord = () => {
            return 1560 + ((215 - globalRankWidth) / 2) + 25;
        }

        context.fillText(player.globalRank, globalRankXCoord(), 332);

        //------------------------------------------------------------------------------
        //average fame
        player.avgFame = player.avgFame.toFixed(0);

        let avgFameWidth, avgFameMultiplier;

        for(let i = 70; i >= 10; i -= 5){ //set clan and global rank multipliers
            context.font = `${i}px Impact`;
            
            const tempAvgFameWidth = context.measureText(player.avgFame).width;

            if(tempAvgFameWidth + 50 < 265){
                avgFameWidth = tempAvgFameWidth;
                avgFameMultiplier = i;
                break;
            }
        }

        context.font = `${avgFameMultiplier}px Impact`;

        const avgFameXCoord = () => {
            return 1355 + ((215 - avgFameWidth) / 2) + 25;
        }

        context.fillText(player.avgFame, avgFameXCoord(), 1218);

        //--------------------------------------------------------------------------------------------
        //table data
        context.font = `40px Impact`;

        const highestClanTrophies = player.weeks.sort((a, b) => b.clanTrophies - a.clanTrophies)[0].clanTrophies;
        const highestFame = player.weeks.sort((a, b) => b.fame - a.fame)[0].fame;
        const lowestClanTrophies = player.weeks.sort((a, b) => a.clanTrophies - b.clanTrophies)[0].clanTrophies;
        const lowestFame = player.weeks.sort((a, b) => a.fame - b.fame)[0].fame;

        player.weeks.sort((a, b) => { //sort by date
            a = new Date(a.date);
            b = new Date(b.date);

            return b - a;
        })

        const clanTrophiesXCoord = txtLength => {
            return 498 + ((195 - txtLength) / 2);
        }

        const fameXCoord = txtLength => {
            return 690 + ((195 - txtLength) / 2);
        }

        let yCoord = 415;

        const indeces = (player.weeks.length < 15) ? player.weeks.length : 15;

        for(let i = 0; i < indeces; i++){
            const { date, clanTrophies, fame } = player.weeks[i];

            context.fillStyle = 'white';
            context.fillText(date, 243, yCoord); //date

            if(clanTrophies === lowestClanTrophies) context.fillStyle = 'red';
            else if(clanTrophies === highestClanTrophies) context.fillStyle = 'green';
            context.fillText(clanTrophies, clanTrophiesXCoord(context.measureText(clanTrophies).width), yCoord); //clan trophies

            if(fame === lowestFame) context.fillStyle = 'red';
            else if(fame === highestFame) context.fillStyle = 'green';
            else context.fillStyle = 'white';
            context.fillText(fame, fameXCoord(context.measureText(fame).width), yCoord); //fame

            yCoord += 59;
        }

        //-------------------------------------------------------------------------
        //chart
        player.weeks = player.weeks.reverse();

        const chart = {
            type: 'line',
            data: {
                labels: player.weeks.map(w => ' '),
                datasets: [
                    {
                        label: 'Fame',
                        data: player.weeks.map(w => w.fame),
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
                        labels: {
                            color: "white",
                            font: {
                                size: 34
                            }
                        }
                    }
                }
            }
        }

        const width = 950;
        const height = 630;
        const chartCanvas = new CanvasRenderService(width, height);
        const chartBuffer = await chartCanvas.renderToBuffer(chart);

        const chartImg = await loadImage(chartBuffer);
        context.drawImage(chartImg, 1010, 430, chartImg.width, chartImg.height);


        message.channel.send(new MessageAttachment(canvas.toBuffer(), 'image.png'));
    }
}