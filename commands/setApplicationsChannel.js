const { orange, green } = require("../data/colors");

module.exports = {
    name: 'setapplicationschannel',
    aliases: ['setapplicationschannel'],
    description: 'Set the server Applications Channel',
    parameters: [],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        //must be server owner or admin role
        const { channels, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { applicationsChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;
        const channelID = message.channel.id;

        if ((message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) && message.author.id !== '493245767448789023') throw 'Only **admins** can set this channel!';

        //channel already linked
        if (args[0]) return message.channel.send({ embeds: [{ color: orange, description: `Use this command in the channel you would like to set as your **Applications** channel!` }] });
        else if (channelID === applicationsChannelID) return message.channel.send({ embeds: [{ color: orange, description: `This channel is **already** set!` }] });

        guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { 'channels.applicationsChannelID': channelID } });
        return message.channel.send({ embeds: [{ color: green, description: `✅ **Applications** channel now set to <#${channelID}>!` }] });
    },
};