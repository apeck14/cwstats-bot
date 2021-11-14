const { ApiRequest } = require("../functions/api");
const { formatTag, getEmoji, getClanBadge } = require("../functions/util");
const { green, orange } = require("../data/colors");

module.exports = {
    name: 'setclan1',
    aliases: ['setclan1', 'setclantag1'],
    description: 'Set Clan 1',
    parameters: ['#TAG'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        //must be server owner or admin role
        const { channels, prefix, adminRoleID, clans } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { tag1, tag2, tag3 } = clans;
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && message.author.id !== '493245767448789023') throw `Only the **server owner** or users with the set admin role can set the clan tag!\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\``;
        else if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;
        else if (!args[0]) throw `**No tag given!** Try again.\n\n__Usage:__\n\`${prefix}setClan1 #TAG\``;

        const clan = await ApiRequest('', args[0], 'clans')
            .catch((e) => {
                if (e.response?.status === 404) throw '**Invalid tag!** Try again.';
            });

        if (!clan) return;

        args[0] = `#${formatTag(args[0])}`;

        //clan tag already linked or clan tag already in use by someone else
        if (tag1 === args[0] || tag2 === args[0] || tag3 === args[0]) return message.channel.send({ embeds: [{ color: orange, description: `You have already linked this clan tag!` }] });

        const [foundTag1, foundTag2, foundTag3] = await Promise.all([guilds.findOne({ 'clans.tag1': args[0] }), guilds.findOne({ 'clans.tag2': args[0] }), guilds.findOne({ 'clans.tag3': args[0] })])
        if (foundTag1 || foundTag2 || foundTag3) return message.channel.send({ embeds: [{ color: orange, description: `This clan has already been linked to a different server.`, footer: { text: `If you believe this is an error, contact Apehk#5688 via Discord.` } }] });

        if (!tag1) statistics.updateOne({}, { $inc: { linkedClans: 1 } }); //add new linked clan (if clan has not been linked in the past)
        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { 'clans.tag1': args[0] } });

        const badgeEmoji = getEmoji(bot, getClanBadge(clan.badgeId, clan.clanWarTrophies));
        message.channel.send({ embeds: [{ color: green, description: `✅ Clan 1 successfully linked to ${badgeEmoji} **${clan.name}**!` }] });

        return console.log(`Clan Linked: ${clan?.name} (${clan?.tag})`);
    },
};