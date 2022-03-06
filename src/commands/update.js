const { pink } = require('../static/colors');
const { getEmoji } = require('../util/functions');

module.exports = {
    data: {
        name: 'update',
        description: 'View information on the latest CW2 Stats bot update.'
    },
    run: async (i, db, client) => {
        const logo = getEmoji(client, 'cw2Stats');

        const embed = {
            color: pink,
            description: '',
            title: `${logo} New Update!`,
            footer: {
                text: '2/26/2022'
            }
        }

        embed.description += `**__Slash Commands__**\nCW2 Stats has migrated to slash commands. More info [here](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ#:~:text=Slash%20Commands%20are%20the%20new,command%20right%20the%20first%20time.).\n\n`
        embed.description += `**__Abbreviations__**\nInstead of linking clan tags to your server, you can now save up to 15 clan abbreviations. Use **/add-abbr** and **/remove-abbr** to manage your server abbreviations, and **/info** to view them.\n\n`;
        embed.description += `**__Stats__**\nPlayer & clan stats have been removed from the bot entirely, but the new website (cwstats.com) will include a much more detailed analysis for both.\n\n`;
        embed.description += `**__Other__**\n• **/reset** - Reset all bot settings back to default.\n• Ability to exclude cards when using **/decks**.\n• Quality of life improvements.\n\n`;
        embed.description += `As always, please join the [Support Server](https://discord.gg/fFY3cnMmnH) with questions and bug reports. Thanks! :)`;

        return i.editReply({ embeds: [embed] });
    }
};
