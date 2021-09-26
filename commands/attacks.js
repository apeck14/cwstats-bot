const { request, red, orange, green, getEmoji } = require("../util/otherUtil");
const { getMembers, getClanBadge } = require("../util/clanUtil");

module.exports = {
    name: 'attacks',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');

        let { channels, color, clanTag, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        if (arg) clanTag = (arg[0] === '#') ? arg.toUpperCase().replace('O', '0') : '#' + arg.toUpperCase().replace('O', '0');

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });
        if (!clanTag) return message.channel.send({ embed: { color: red, description: `**No clan tag linked!** Please use \`${prefix}setClanTag\` to link your clan.` } });

        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}/currentriverrace`);
        if (!rr) return message.channel.send({ embed: { color: red, description: `**Invalid clan tag!**` } });
        else if (rr.clans.length <= 1) return message.channel.send({ embed: { color: orange, description: `**This clan is not in a race.**` } }); //no race happening

        const currentMemberTags = await getMembers(clanTag, true);

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
            desc += `\n**__4 Attacks Left__**\n`;
            fourAttacks.forEach(p => desc += `• ${p.name}\n`);
        }
        if (threeAttacks.length > 0) {
            desc += `\n**__3 Attacks Left__**\n`;
            threeAttacks.sort((a, b) => b.name - a.name).forEach(p => desc += `• ${p.name}\n`);
        }
        if (twoAttacks.length > 0) {
            desc += `\n**__2 Attacks Left__**\n`;
            twoAttacks.sort((a, b) => b.name - a.name).forEach(p => desc += `• ${p.name}\n`);
        }
        if (oneAttack.length > 0) {
            desc += `\n**__1 Attack Left__**\n`;
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