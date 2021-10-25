const { green, orange } = require("../data/colors");

module.exports = {
    name: 'setapplychannel',
    aliases: ['setapplychannel'],
    description: 'Set the server Apply Channel',
    parameters: ['#CHANNEL'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        //must be server owner or admin role
        const { channels, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { applyChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;
        const channelID = message.channel.id;

        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && message.author.id !== '493245767448789023') throw 'Only **admins** can set this channel!';

        //channel already linked
        if (args[0]) return message.channel.send({ embed: { color: orange, description: `Use this command in the channel you would like to set as your **Apply** channel!` } });
        else if (channelID === applyChannelID) return message.channel.send({ embed: { color: orange, description: `This channel is **already** set!` } });

        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { 'channels.applyChannelID': channelID } });
        return message.channel.send({ embed: { color: green, description: `✅ **Apply** channel now set to <#${channelID}>!` } });
    },
};