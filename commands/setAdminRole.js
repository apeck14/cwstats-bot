const { orange, green } = require("../data/colors");

module.exports = {
    name: 'setadminrole',
    aliases: ['setadminrole'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        //only server owner can set this role
        //must be used in command channel

        const { channels, prefix, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if ((guildOwnerID !== message.author.id && !message.member.hasPermission('ADMINISTRATOR')) && message.author.id !== '493245767448789023') throw `Only the **server owner** or users with ADMINISTRATOR permissions can set this role!\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\``
        else if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        if (!args[0]) throw `**No role given!** Try again.\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\``;

        const roleID = args[0].replace(/[^0-9]/g, '');

        if (!message.guild.roles.cache.has(roleID)) throw `**Invalid role!** Try again.\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\``;

        //role already linked
        if (roleID === adminRoleID) return message.channel.send({ embed: { color: orange, description: `This role is **already** set!` } });

        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { adminRoleID: roleID } });
        return message.channel.send({ embed: { color: green, description: `✅ **Admin** role now set to <@&${roleID}>!` } });
    },
};