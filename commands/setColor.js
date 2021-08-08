const { red, orange } = require("../util/otherUtil");

module.exports = {
    name: 'setcolor',
    execute: async (message, arg, bot, guilds, linkedAccounts, matches, statistics, weeksAdded) => {
        //must be server owner or admin role
        const { channels, prefix, adminRoleID, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: 'Only **admins** can set the color!' } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No color hex given!** Try again.\n\n__Usage:__\n\`${prefix}setColor #HEX\`` } });
        else if (arg.indexOf("#") !== 0) return message.channel.send({ embed: { color: red, description: `**All hex codes must begin with a '#'!** Try again.\n\n__Usage:__\n\`${prefix}setColor #HEX\`` } });
        else if (!/^#([0-9A-F]{3}){1,2}$/i.test(arg)) return message.channel.send({ embed: { color: red, description: `**Invalid color hex!** Try again.\n\n__Usage:__\n\`${prefix}setColor #HEX\`` } });

        //color already linked
        if (color === arg.toUpperCase()) return message.channel.send({ embed: { color: orange, description: `This color is already in use!` } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { color: arg.toUpperCase() } });
            message.channel.send({ embed: { color: arg, description: `✅ Clan **color** now set to **${arg.toUpperCase()}**!` } });
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }

    },
};