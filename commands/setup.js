const mongoUtil = require("../util/mongoUtil");

module.exports = {
    name: 'setup',
    execute: async (message) => {
        const db = await mongoUtil.db("General");
        const guilds = db.collection("Guilds");

        const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        let desc = `Welcome to **CW2 Stats**! The all-in-one Clash Royale war bot to track performance of your clan members, check river race stats, set up an application process through Discord, and more! To get started:`;
        desc += `\n\n**__1. Set the Admin Role__**\nThis will allow all users in this server with a specific role to use my admin commands! Only the **server owner** and users with administrator permissions can set this role.\n\`\`\`${prefix}setAdminRole @ROLE\`\`\``;
        desc += `\n**__2. Link Your Clan__**\nLink your clan to enable performance tracking for your clan. \n\`\`\`${prefix}setClanTag #TAG\`\`\``;
        desc += `\n**__3. Sync War Stats__**\nSync your clans' war stats to retrieve all data from recent war weeks. Use this command at the start of each new week to add the previous week. \n\`\`\`${prefix}sync\`\`\``;
        desc += `\n**__4. Set the Command Channel__** (Optional)\nSet a desginated channel where all bot commands will be used. This will keep your server organized, as commands will not work outside of this channel. \n\`\`\`${prefix}setCommandChannel #CHANNEL\`\`\``;
        desc += `\n**__5. Automated Recruitment through Discord__** (Optional)\nIf your server is open to the public and you'd like to more easily manage join requests, set the apply channel (where all new users will use the ${prefix}apply command) and set the applications channel (where all requests should be posted for leadership to review). \n\`\`\`${prefix}setApplyChannel #CHANNEL\n${prefix}setApplicationsChannel #CHANNEL\`\`\``;
        desc += `\n**__6. Change Prefix and Bot Color__** (Optional)\nIf need be, you can change my prefix (default: ?), or change the color of my messages to match your clan. \n\`\`\`${prefix}prefix PREFIX\n${prefix}setColor #HEXCODE\`\`\``;
        desc += `\n**Finished!** The bot should now be fully functional within your server. To see the full list of commands, use ${prefix}help.`;

        return message.channel.send({embed: {
            title: '__Setup__',
            color: '#ff237a',
            footer: {
                text: 'For help, suggestions, or bug reports contact Apehk#5688 via Discord.'
            },
            description: desc
        }})
    }
}