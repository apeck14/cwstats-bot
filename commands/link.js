const { ApiRequest } = require('../functions/api');
const { formatTag } = require('../functions/util');
const { green, orange } = require("../data/colors");

module.exports = {
    name: 'link',
    aliases: ['link', 'save'],
    description: 'Link a tag to your Discord account',
    parameters: ['#TAG'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;
        else if (!args[0]) throw `**No tag given!**\n\n__Usage:__\n\`${prefix}link #ABC123\``;

        const player = await ApiRequest('', args[0], 'players')
            .catch((e) => {
                if (e.response?.status === 404) throw '**Invalid tag.** Try again.';
            });

        if (!player) return;

        const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });

        args[0] = formatTag(args[0]);

        //if user doesn't already have a linked account
        if (!linkedAccount) {
            linkedAccounts.insertOne(
                {
                    discordName: message.author.username,
                    discordID: message.author.id,
                    tag: '#' + args[0]
                }
            );

            return message.channel.send({ embeds: [{ color: green, description: `✅ Account linked to **${player.name}**!` }] });
        }
        //already linked to that tag
        else if (linkedAccount.tag === `#${args[0]}`) {
            return message.channel.send({ embeds: [{ color: orange, description: "**You have already linked that ID!**" }] });
        }
        //already linked, send confirmation embed to update to new tag
        else {
            //send confirmatiom embed
            const confirmEmbed = await message.channel.send({ embeds: [{ color: green, description: `Are you sure you want to link your account to a new ID?\n\n**Old ID:** ${linkedAccount.tag}\n**New ID:** #${args[0]}` }] });

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
                linkedAccounts.updateOne({ discordID: message.author.id }, { $set: { tag: `#${args[0]}` } });

                return message.channel.send({ embeds: [{ color: green, description: `✅ Updated! Account linked to **${player.name}**` }] });
            }
        }
    }
}