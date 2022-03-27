const { getPlayer, getClan } = require("../util/api");
const { pink, green } = require('../static/colors');
const { getClanBadge, getEmoji, getArenaEmoji, formatTag, getLeague, sortArrOfBadges } = require("../util/functions");
const { createCanvas, registerFont, loadImage } = require("canvas");

module.exports = {
    data: {
        name: 'apply',
        description: 'Apply to join the clan.',
        options: [
            {
                type: 3,
                name: 'tag',
                description: '#PLAYERTAG',
                required: true
            }
        ]
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');
        const { channels } = await guilds.findOne({ guildID: i.channel.guild.id });
        const { applicationsChannelID } = channels;

        let tag = i.options.getString('tag');

        const player = await getPlayer(tag).catch(async e => {
            if (e?.response?.status === 404) throw '**Player not found.**';

            throw e?.response?.statusText || 'Unexpected Error.';
        });

        //create profile badges image
        const profileBadges = [];

        for (const b of player?.badges) {
            if (b.name === 'Classic12Wins') { //ccs
                if (b.progress < 10) profileBadges.push('cc');
                else if (b.progress < 100) profileBadges.push('cc-10');
                else profileBadges.push('cc-100');
            }
            else if (b.name === 'Grand12Wins') { //gcs
                if (b.progress < 10) profileBadges.push('gc');
                else if (b.progress < 100) profileBadges.push('gc-10');
                else profileBadges.push('gc-100');
            }
            else if (b.name === '1000Wins') profileBadges.push('wins-1000'); //1000 wins
            else if (b.name.includes('Played')) profileBadges.push(`years-${b.name[6]}`); //years played
            else if (b.name.includes('LadderTop1000')) profileBadges.push({ name: 'ladder', progress: `#${b.progress}` }); //ladder
            else if (b.name === 'TopLeague' && b.progress >= 5000) profileBadges.push(getLeague(b.progress)); //TOP LEAGUE
            else if (b.name.includes('LadderTournamentTop1000')) profileBadges.push({ name: 'gt', progress: `#${b.progress}` }); //GTs
            else if (b.name === 'Crl20Wins2021') profileBadges.push({ ...b, name: 'crl-2021' }); //CRL2021
            else if (b.name.includes('Crl20Wins')) profileBadges.push({ ...b, name: 'crl' }); //CRL
            else if (b.name === 'ClanWarWins') {
                if (b.progress >= 100) profileBadges.push('cw1-100')
                else if (b.progress >= 10) profileBadges.push('cw1-10')
                else if (b.progress >= 1) profileBadges.push('cw1')
            }
        }

        let badgeCanvas;

        //create profile badges image
        if (profileBadges.length > 0) {
            sortArrOfBadges(profileBadges);

            const rows = Math.ceil(profileBadges.length / 5);
            badgeCanvas = createCanvas(900, rows * (165 + 15));
            const context = badgeCanvas.getContext('2d');

            registerFont('./src/static/fonts/Supercell-Magic.ttf', { family: 'Supercell-Magic' });
            context.font = `17px Supercell-Magic`;
            context.fillStyle = 'white';

            let dx = -17; //distance from left edge
            let dy = 0; //distance from top edge

            for (let i = 0; i < profileBadges.length; i++) {
                if (i % 5 === 0 && i !== 0) {
                    dx = -17;
                    dy += 165 + 15; //move to next row
                }

                const b = profileBadges[i];
                const badgeImg = await loadImage(`./src/static/images/profile/${b?.name || b}.png`);

                context.drawImage(badgeImg, dx, dy, 165, 165);

                if (b instanceof Object) { //write text on badge (GTs/LADDER/CRL/CRL21)
                    const textWidth = context.measureText(b.progress).width;
                    const x = dx + ((165 - textWidth) / 2);
                    const y = dy + 135;

                    context.fillText(b.progress, x, y);
                    context.shadowColor = 'black';
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 2;
                    context.shadowOffsetY = 2;
                    context.fillText(b.progress, x, y); //shadow
                }

                dx += 140;
            }
        }

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

        const applicationEmbed = {
            color: pink,
            title: '__New Application!__',
            description: ``
        }

        applicationEmbed.description += `${levelEmoji} [**${player.name}**](https://royaleapi.com/player/${formatTag(tag).substr(1)})\n`;
        applicationEmbed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n${badgeEmoji} **${player.clan.name}**\n\n`; //clan & ladder
        applicationEmbed.description += `**__Stats__**\n**CW1 War Wins**: ${player.warDayWins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n`; //stats
        applicationEmbed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}`; //cards
        applicationEmbed.description += `\n\n**Request By**: ${`<@!${i.user.id}>`}`;

        i.editReply({
            embeds: [{
                color: green,
                description: `✅ Request sent for **${player.name}**! A Co-Leader will contact you shortly.`
            }]
        });

        const response = {
            embeds: [applicationEmbed],
            files: []
        }

        if (profileBadges.length > 0) {
            response.files.push({
                attachment: badgeCanvas.toBuffer(),
                name: 'badges.png'
            });

            applicationEmbed.image = {
                url: 'attachment://badges.png'
            }
        }

        return client.channels.cache.get(applicationsChannelID).send(response);
    }
}
