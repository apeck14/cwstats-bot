const { green } = require('../static/colors');

module.exports = {
    data: {
        name: 'reset',
        description: 'Reset all bot settings to default.',
        userPermissions: ['ADMINISTRATOR']
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');

        await guilds.updateOne({ guildID: i.channel.guild.id }, {
            $set: {
                'abbreviations': [],
                'channels.applyChannelID': null,
                'channels.applicationsChannelID': null,
                'channels.commandChannelID': null
            }
        });

        return await i.editReply({
            embeds: [{
                color: green,
                description: `✅ All bot settings successfully reset to **default**!`
            }]
        });
    }
};
