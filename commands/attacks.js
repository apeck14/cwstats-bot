const { request, red, orange, green } = require("../util/otherUtil");
const { getMembers } = require("../util/clanUtil");

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

        const remainingAttacks = rr.clan.participants
            .filter(p => currentMemberTags.includes(p.tag)) //current members only
            .map(p => ({ name: p.name, attacksLeft: 4 - p.decksUsedToday }))
            .filter(p => p.attacksLeft > 0)
            .sort((a, b) => b.attacksLeft - a.attacksLeft);

        const totalAttacksLeft = remainingAttacks.reduce((a, b) => b.attacksLeft + a, 0);
        const currentFame = () => {
            if (rr.clan.fame === 0 && rr.clan.periodPoints === 0) return 0;
            else if (rr.clan.fame > 0 && rr.clan.periodPoints === 0) return rr.clan.fame;
            return rr.clan.periodPoints;
        }

        let desc = ``;

        if (totalAttacksLeft === 0) return message.channel.send({ embed: { color: green, description: `All attacks have been used!` } }); //all attacks used
        else if (totalAttacksLeft !== 0 && remainingAttacks.length === 0) { //attacks left, but all members currently in clan have used attacks
            return message.channel.send({ embed: { color: color, description: `**${rr.clan.name}**\n<:fame:807475879215104020> **${currentFame()}**\nAttacks Left: **${totalAttacksLeft}**\n\n*All current members have completed attacks!*` } });
        }

        desc += `**${rr.clan.name}**\n<:fame:807475879215104020> **${currentFame()}**\nAttacks Left: **${totalAttacksLeft}**\n`;

        if (remainingAttacks.some(p => p.attacksLeft === 4)) {
            desc += `\n**__4 Attacks Left__**\n`;
            remainingAttacks.filter(p => p.attacksLeft === 4).forEach(p => desc += `• ${p.name}\n`);
        }
        if (remainingAttacks.some(p => p.attacksLeft === 3)) {
            desc += `\n**__3 Attacks Left__**\n`;
            remainingAttacks.filter(p => p.attacksLeft === 3).forEach(p => desc += `• ${p.name}\n`);
        }
        if (remainingAttacks.some(p => p.attacksLeft === 2)) {
            desc += `\n**__2 Attacks Left__**\n`;
            remainingAttacks.filter(p => p.attacksLeft === 2).forEach(p => desc += `• ${p.name}\n`);
        }
        if (remainingAttacks.some(p => p.attacksLeft === 1)) {
            desc += `\n**__1 Attack Left__**\n`;
            remainingAttacks.filter(p => p.attacksLeft === 1).forEach(p => desc += `• ${p.name}\n`);
        }

        message.channel.send({ embed: { title: `__Remaining Attacks__`, color: color, description: desc } });

    }
}