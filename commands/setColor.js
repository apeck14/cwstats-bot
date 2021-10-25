const { orange } = require("../data/colors");

module.exports = {
    name: 'setcolor',
    aliases: ['setcolor', 'color'],
    description: 'Set the server color',
    parameters: ['#HEX'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        //must be server owner or admin role
        const { channels, prefix, adminRoleID, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && message.author.id !== '493245767448789023') throw 'Only **admins** can set the color!';
        else if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        if (!args[0]) throw `**No color hex given!** Try again.\n\n__Usage:__\n\`${prefix}setColor #HEX\``;
        else if (!args[0].startsWith('#')) throw `**All hex codes must begin with a '#'!** Try again.\n\n__Usage:__\n\`${prefix}setColor #HEX\``;
        else if (!/^#([0-9A-F]{3}){1,2}$/i.test(args[0])) throw `**Invalid color hex!** Try again.\n\n__Usage:__\n\`${prefix}setColor #HEX\``;

        //color already linked
        if (color === args[0].toUpperCase()) return message.channel.send({ embed: { color: orange, description: `This color is already set!` } });

        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { color: args[0].toUpperCase() } });
        return message.channel.send({ embed: { color: args[0], description: `✅ Clan **color** now set to **${args[0].toUpperCase()}**!` } });
    },
};