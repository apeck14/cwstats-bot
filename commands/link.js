const { red, orange, green, request } = require("../util/otherUtil");

module.exports = {
    name: 'link',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!**\n\n__Usage:__\n\`${prefix}link #ABC123\`` } });

        arg = arg.toUpperCase().replace('O', '0');
        const tag = (arg[0] === '#') ? arg : '#' + arg;
        const player = await request(`https://proxy.royaleapi.dev/v1/players/%23${tag.substr(1)}`);
        if (!player) return message.channel.send({ embed: { color: red, description: `**Player not found.**` } });

        try {
            const linked = await linkedAccounts.findOne({ discordID: message.author.id });

            //if user doesn't already have a linked account
            if (!linked) {
                await linkedAccounts.insertOne(
                    {
                        discordName: message.author.username,
                        discordID: message.author.id,
                        tag: tag
                    }
                );

                return message.channel.send({ embed: { color: green, description: `✅ Account linked to **${player.name}**!` } });
            }
            //already linked to that tag
            else if (linked.tag === tag) {
                return message.channel.send({ embed: { color: orange, description: "**You have already linked that ID!**" } });
            }
            //already linked, send confirmation embed to update to new tag
            else {
                //send confirmatiom embed
                const confirmEmbed = await message.channel.send({ embed: { color: green, description: `Are you sure you want to link your account to a new ID?\n\n**Old ID:** ${linked.tag}\n**New ID:** ${tag}` } });

                const emojis = ['✅', '❌'];
                for (const e of emojis) await confirmEmbed.react(e);
                const emojiCollector = await confirmEmbed.awaitReactions((r, u) => u.id === message.author.id && emojis.includes(r.emoji.name), { max: 1, time: 30000 });
                const firstReact = emojiCollector.first();

                confirmEmbed.delete();

                //check reaction
                if (!firstReact || firstReact._emoji.name === '❌') {
                    return;
                }
                else {
                    linkedAccounts.updateOne({ discordID: message.author.id }, { $set: { tag: tag } });

                    return message.channel.send({ embed: { color: green, description: `✅ Updated! Account linked to **${player.name}**` } });
                }
            }
        } catch (e) {
            console.dir(e);
            return message.channel.send({ embed: { color: red, description: `Unexpected Error.` } });
        }
    }
}