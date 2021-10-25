module.exports = {
    name: 'info',
    aliases: ['info', 'i'],
    description: 'View sever & bot info',
    parameters: [],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');
        const matches = db.collection('Matches');

        const { channels, clans, adminRoleID, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { tag1, tag2, tag3 } = clans;
        const { commandChannelID, applyChannelID, applicationsChannelID } = channels;
        const { commandsUsed, linkedClans } = (await statistics.find({}).toArray())[0];

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        const serverCount = () => {
            let sum = 0;

            bot.guilds.cache.each(() => {
                sum++;
            });

            return sum;
        };

        const players = await matches.distinct('tag');

        const adminRole = (adminRoleID) ? `<@${adminRoleID}>` : '*NOT SET*';
        const colorHex = color || '*NOT SET*';
        const cmdChnl = (commandChannelID) ? `<#${commandChannelID}>` : '*NOT SET*';
        const applyChnl = (applyChannelID) ? `<#${applyChannelID}>` : '*NOT SET*';
        const appChnl = (applicationsChannelID) ? `<#${applicationsChannelID}>` : '*NOT SET*';
        const clan1 = tag1 || '*NOT SET*';
        const clan2 = tag2 || '*NOT SET*';
        const clan3 = tag3 || '*NOT SET*';

        return message.channel.send({
            embed: {
                title: '__Bot & Server Info__',
                color: '#ff237a',
                footer: {
                    text: `Developed By: Apehk`
                },
                description: `**Servers**: ${serverCount()}\n**Commands Used**: ${commandsUsed}\n**Clans**: ${linkedClans}\n**Players**: ${players.length}\n\n**__Server__**\n**Clan 1**: ${clan1}\n**Clan 2**: ${clan2}\n**Clan 3**: ${clan3}\n**Color**: ${colorHex}\n**Admin Role**: ${adminRole}\n**Command Channel**: ${cmdChnl}\n**Apply Channel**: ${applyChnl}\n**Applications Channel**: ${appChnl}`
            }
        });
    }
}