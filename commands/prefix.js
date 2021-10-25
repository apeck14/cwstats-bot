const { green, orange } = require("../data/colors");

module.exports = {
    name: 'prefix',
    aliases: ['prefix'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        //must be server owner or admin role
        const { channels, prefix, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && (message.author.id !== '493245767448789023')) throw 'Only **admins** can set the prefix!';
        else if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        if (!args[0]) throw `**No prefix given!** Try again.\n\n__Usage:__\n\`${prefix}prefix !\``;
        else if (args[0].length > 2) throw `Prefix can be up to 2 characters in length!`;

        //prefix already linked
        if (prefix === args[0]) return message.channel.send({ embed: { color: orange, description: `This prefix has **already** been set!` } });

        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { prefix: args[0] } });
        return message.channel.send({ embed: { color: green, description: `✅ **Prefix** now set to **${args[0]}**` } });
    }
};