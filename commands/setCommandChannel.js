const { red, green, orange } = require("../util/otherUtil");

module.exports = {
    name: 'setcommandchannel',
    execute: async (message, arg, bot, guilds, linkedAccounts, matches, statistics, weeksAdded) => {
        //must be server owner or admin role
        const { adminRoleID, channels } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;
        const channelID = message.channel.id;

        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: 'Only **admins** can set this channel!' } });

        //channel already linked
        if (channelID === commandChannelID) return message.channel.send({ embed: { color: orange, description: `This channel is **already** set!` } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { 'channels.commandChannelID': channelID } });
            message.channel.send({ embed: { color: green, description: `✅ **Command** channel now set to <#${channelID}>!` } });
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }

    },
};