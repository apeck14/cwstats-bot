const { green, orange } = require('../static/colors');

module.exports = {
    data: {
        name: 'set-apply-channel',
        description: 'Set/unset apply channel.',
        options: [
            {
                type: 7,
                name: 'channel',
                description: 'Set channel where players will apply from.',
                required: true,
                channel_types: [0] //text channels only
            }
        ],
        userPermissions: ['MANAGE_GUILD']
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');

        const { channels } = await guilds.findOne({ guildID: i.channel.guild.id });
        const { applyChannelID } = channels;

        const channel = i.options.getChannel('channel');

        if (channel.id === applyChannelID)
            return i.editReply({ embeds: [{ color: orange, description: `**This channel is already set!**` }] });

        guilds.updateOne({ guildID: i.channel.guild.id }, { $set: { 'channels.applyChannelID': channel.id } });
        return i.editReply({
            embeds: [{
                color: green,
                description: `✅ **Apply** channel now set to <#${channel.id}>!`
            }]
        });
    }
};
