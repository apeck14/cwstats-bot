const { readdirSync } = require('fs');
const { pink } = require('../data/colors');

module.exports = {
    name: 'help',
    aliases: ['help', 'commands', 'cmds'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        const commands = readdirSync('./commands').filter(file => file.endsWith('.js'));

        let desc = '';

        for (const file of commands) {
            const c = require(`../commands/${file}`);

            if (!c.description) continue;

            desc += `• **${prefix}${file.replace('.js', '')} ${c.parameters.join('/')}**\n${c.description}\n`;
        }

        return message.channel.send({
            embeds: [{
                title: '__CW2 Stats Commands__',
                description: desc,
                color: pink
            }]
        })
    }
}