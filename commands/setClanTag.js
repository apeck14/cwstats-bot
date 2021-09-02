const { getClanBadge } = require("../util/clanUtil");
const { red, green, request, orange, getEmoji } = require("../util/otherUtil");

module.exports = {
    name: 'setclantag',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        //must be server owner or admin role
        const { channels, prefix, adminRoleID, clanTag } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        arg = arg.toUpperCase().replace('O', '0');
        const tag = (arg[0] === '#') ? arg : '#' + arg;
        const clan = await request(`https://proxy.royaleapi.dev/v1/clans/%23${(arg[0] === '#') ? arg.substr(1) : arg}`);

        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: `Only the **server owner** or users with the set admin role can set the clan tag!\n\n__Usage:__\n\`${prefix}setClanTag #TAG\`\n\`${prefix}setAdminRole @ROLE\`` } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!** Try again.\n\n__Usage:__\n\`${prefix}setClanTag #TAG\`` } });
        else if (!clan) return message.channel.send({ embed: { color: red, description: `**Invalid tag!** Try again.\n\n__Usage:__\n\`${prefix}setClanTag #TAG\`` } });

        //clan tag already linked or clan tag already in use by someone else
        if (clanTag === tag) return message.channel.send({ embed: { color: orange, description: `Server is **already** linked to that clan!` } });
        else if (await guilds.findOne({ clanTag: tag })) return message.channel.send({ embed: { color: orange, description: `This clan has already been linked to a different server.`, footer: { text: `If you believe this is an error, contact Apehk#5688 via Discord.` } } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            if (!clanTag) statistics.updateOne({}, { $inc: { linkedClans: 1 } }); //add new linked clan (if clan has not been linked in the past)
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { clanTag: tag } });

            const badgeEmoji = getEmoji(bot, getClanBadge(clan.badgeId, clan.clanWarTrophies));
            message.channel.send({ embed: { color: green, description: `✅ Server successfully linked to ${badgeEmoji} **${clan.name}**!` } });

            console.log(`Clan Linked: ${clan?.name} (${clan?.tag})`);
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }
    },
};