const { pink } = require('../static/colors');

module.exports = {
    data: {
        name: 'info',
        description: 'View bot & server stats, and abbreviations.'
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        const { commandsUsed, totalAbbreviations } = (await statistics.find({}).toArray())[0];
        const { abbreviations, channels } = await guilds.findOne({ guildID: i.channel.guild.id });
        const { commandChannelID, applyChannelID, applicationsChannelID } = channels;

        const serverCount = () => {
            let sum = 0;

            client.guilds.cache.each(() => {
                sum++;
            });

            return sum;
        };
        const cmdChnl = (commandChannelID) ? `<#${commandChannelID}>` : 'N/A';
        const applyChnl = (applyChannelID) ? `<#${applyChannelID}>` : 'N/A';
        const appChnl = (applicationsChannelID) ? `<#${applicationsChannelID}>` : 'N/A';

        const embed = {
            description: '',
            color: pink,
            footer: {
                text: 'Developed By: Apehk\nLogo By: Garebear'
            }
        }

        embed.description += `**__Bot Info__**\n**Servers**: ${serverCount()}\n**Commands Used**: ${commandsUsed}\n**Total Abbreviations**: ${totalAbbreviations}\n\n`;
        embed.description += `**__Server Info__**\n**Command Channel**: ${cmdChnl}\n**Apply Channel**: ${applyChnl}\n**Applications Channel**: ${appChnl}`;

        if (abbreviations?.length > 0)
            embed.description += `\n**Abbreviations**: ${abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr)).map(a => `\n• \`${a.abbr}\`: ${a.name}`).join('')}`;

        return i.editReply({ embeds: [embed] });
    }
};
