const { ApiRequest } = require('../functions/api');
const { getEmoji, getClanBadge } = require('../functions/util');
const { green, orange } = require('../data/colors');

module.exports = {
    name: 'attacks',
    aliases: ['attacks', 'atks', 'a'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        const { channels, color, clans, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const { tag1, tag2, tag3 } = clans;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tag;

        if (!args[0] || args[0] === '1') {
            if (!tag1) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan1 #ABC123\`\`\``;
            tag = tag1;
        }
        else if (args[0] === '2') {
            if (!tag2) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan2 #ABC123\`\`\``;
            tag = tag2;
        }
        else if (args[0] === '3') {
            if (!tag3) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan3 #ABC123\`\`\``;
            tag = tag3;
        }
        else tag = '#' + formatTag(args[0]);

        const rr = await ApiRequest('currentriverrace', tag)
            .catch((e) => {
                if (e.response?.status === 404) message.channel.send({ embed: { description: '**Clan is not in a river race, or invalid tag.**', color: orange } });
            });

        if (!rr) return;
        else if (rr.clans.length <= 1) return message.channel.send({ embed: { description: '**Clan is not in a river race.**', color: orange } });

        const currentMemberTags = await ApiRequest('members', tag, '', true);

        const totalAttacksLeft = 200 - rr.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0);

        const remainingAttacks = rr.clan.participants.map(p => ({ name: p.name, tag: p.tag, attacksUsedToday: p.decksUsedToday }));

        const fourAttacks = [];
        const threeAttacks = [];
        const twoAttacks = []
        const oneAttack = [];

        let showFooter = false;

        for (const p of remainingAttacks) { //push all players to appropiate array
            if (p.attacksUsedToday === 0) {
                if (currentMemberTags.includes(p.tag)) fourAttacks.push(p);
            }
            else if (p.attacksUsedToday === 1) {
                if (!currentMemberTags.includes(p.tag)) {
                    p.name += '*';
                    showFooter = true;
                }
                threeAttacks.push(p);
            }
            else if (p.attacksUsedToday === 2) {
                if (!currentMemberTags.includes(p.tag)) {
                    p.name += '*';
                    showFooter = true;
                }
                twoAttacks.push(p);
            }
            else if (p.attacksUsedToday === 3) {
                if (!currentMemberTags.includes(p.tag)) {
                    p.name += '*';
                    showFooter = true;
                }
                oneAttack.push(p);
            }
        }

        fourAttacks.sort((a, b) => a.name.localeCompare(b.name));
        threeAttacks.sort((a, b) => a.name.localeCompare(b.name));
        twoAttacks.sort((a, b) => a.name.localeCompare(b.name));
        oneAttack.sort((a, b) => a.name.localeCompare(b.name));

        const currentFame = () => {
            if (rr.clan.fame === 0 && rr.clan.periodPoints === 0) return 0;
            else if (rr.clan.fame > 0 && rr.clan.periodPoints === 0) return rr.clan.fame;
            return rr.clan.periodPoints;
        }

        const badgeEmoji = getEmoji(bot, getClanBadge(rr.clan.badgeId, rr.clan.clanScore));
        const fameEmoji = getEmoji(bot, 'fame');

        let desc = ``;

        if (totalAttacksLeft === 0) return message.channel.send({ embed: { color: green, description: `All attacks have been used!` } }); //all attacks used
        else if (totalAttacksLeft !== 0 && remainingAttacks.filter(p => p.attacksUsedToday < 4).length === 0) { //attacks left, but all members currently in clan have used attacks
            return message.channel.send({ embed: { title: '__Remaining Attacks__', color: color, description: `${badgeEmoji} **${rr.clan.name}**\n${fameEmoji} **${currentFame()}**\nAttacks Left: **${totalAttacksLeft}**\n\n*All current members have completed attacks!*` } });
        }

        desc += `${badgeEmoji} **${rr.clan.name}**\n${fameEmoji} **${currentFame()}**\nAttacks Left: **${totalAttacksLeft}**\n`;

        if (fourAttacks.length > 0) {
            desc += `\n**__4 Attacks__**\n`;
            fourAttacks.forEach(p => desc += `• ${p.name}\n`);
        }
        if (threeAttacks.length > 0) {
            desc += `\n**__3 Attacks__**\n`;
            threeAttacks.sort((a, b) => b.name - a.name).forEach(p => desc += `• ${p.name}\n`);
        }
        if (twoAttacks.length > 0) {
            desc += `\n**__2 Attacks__**\n`;
            twoAttacks.sort((a, b) => b.name - a.name).forEach(p => desc += `• ${p.name}\n`);
        }
        if (oneAttack.length > 0) {
            desc += `\n**__1 Attack__**\n`;
            oneAttack.sort((a, b) => b.name - a.name).forEach(p => desc += `• ${p.name}\n`);
        }

        return message.channel.send({
            embed: {
                title: `__Remaining Attacks__`,
                color: color, description: desc,
                footer: {
                    text: (showFooter) ? `* = Not in clan` : ``
                }
            }
        });
    }
}