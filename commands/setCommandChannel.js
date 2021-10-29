const { orange, green } = require("../data/colors");

module.exports = {
    name: 'setcommandchannel',
    aliases: ['setcommandchannel'],
    description: 'Set the server Command Channel',
    parameters: [],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        //must be server owner or admin role
        const { adminRoleID, channels } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;
        const channelID = message.channel.id;

        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && message.author.id !== '493245767448789023') throw 'Only **admins** can set the color!';
        else if (channelID === commandChannelID) return message.channel.send({ embed: { color: orange, description: `**This channel is already set!**` } });

        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { 'channels.commandChannelID': channelID } });
        return message.channel.send({ embed: { color: green, description: `✅ **Command** channel now set to <#${channelID}>!` } });
    },
};