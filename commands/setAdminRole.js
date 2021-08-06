const mongoUtil = require("../util/mongoUtil");
const { red, green, orange } = require("../util/otherUtil");

module.exports = {
    name: 'setadminrole',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection("Guilds");

        //only server owner can set this role
        //must be used in command channel

        const { channels, prefix, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        if (guildOwnerID !== message.author.id && !message.member.hasPermission('ADMINISTRATOR')) return message.channel.send({ embed: { color: red, description: `Only the **server owner** or users with ADMINISTRATOR permissions can set this role!\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\`` } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        let roleID = arg.substr(3); //remove first three characters "<@&"
        roleID = roleID.slice(0, -1); //remove last character ">"

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No role given!** Try again.\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\`` } });
        else if (!message.guild.roles.cache.has(roleID)) return message.channel.send({ embed: { color: red, description: `**Invalid role!** Try again.\n\n__Usage:__\n\`${prefix}setAdminRole @ROLE\`` } });

        //role already linked
        if (roleID === adminRoleID) return message.channel.send({ embed: { color: orange, description: `This role is **already** set!` } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { adminRoleID: roleID } });
            message.channel.send({ embed: { color: green, description: `✅ **Admin** role now set to <@&${roleID}>!` } });
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }
    },
};