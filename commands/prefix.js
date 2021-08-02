const mongoUtil = require("../util/mongoUtil");
const { red, green, orange } = require("../util/otherUtil");

module.exports = {
    name: 'prefix',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("General");
        const guilds = db.collection("Guilds");

        //must be server owner or admin role
        const { channels, prefix, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: 'Only **admins** can set this channel!' } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No prefix given!** Try again.\n\n__Usage:__\n\`${prefix}prefix !\`` } });
        else if (arg.length !== 1) return message.channel.send({ embed: { color: red, description: `Prefix can only be **1** character!\n\n__Usage:__\n\`${prefix}prefix !\`` } });
        else if (/^[a-z0-9]+$/i.test(arg)) return message.channel.send({ embed: { color: red, description: `**Prefix cannot be a letter or number!** Try again.\n\n__Usage:__\n\`${prefix}prefix !\`` } });

        //prefix already linked
        if (prefix === arg) return message.channel.send({ embed: { color: orange, description: `This prefix has **already** been set!` } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { prefix: arg } });
            message.channel.send({ embed: { color: green, description: `✅ **Prefix** now set to **${arg}**` } });
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }

    },
};