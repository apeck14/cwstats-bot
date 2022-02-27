const { getClan } = require("../util/api");
const { red, green } = require('../static/colors');
const { formatTag, getClanBadge, getEmoji } = require("../util/functions");

module.exports = {
    data: {
        name: 'add-abbr',
        description: 'Add an abbreviation for any clan!',
        options: [
            {
                type: 3,
                name: 'tag',
                description: '#CLANTAG',
                required: true
            },
            {
                type: 3,
                name: 'abbr',
                description: 'Select abbreviation (alphanumeric)',
                required: true
            }
        ],
        userPermissions: ['MANAGE_GUILD']
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');
        const { abbreviations } = await guilds.findOne({ guildID: i.channel.guild.id });

        const abbreviation = i.options.getString('abbr');
        const tag = i.options.getString('tag');

        if (abbreviations.length >= 10)
            return i.editReply({ embeds: [{ description: '**Only 10 abbreviations can be set.** Remove an existing abbreviation and try again.', color: red }], ephemeral: true });

        if (!abbreviation.match(/^[0-9a-z]+$/))
            return i.editReply({ embeds: [{ description: '**Abbreviation must be alphanumeric.**', color: red }], ephemeral: true });

        if (abbreviation.length > 5)
            return i.editReply({ embeds: [{ description: '**Abbreviation cannot be larger than 5 characters.**', color: red }], ephemeral: true });

        if (abbreviations.find(a => a.abbr === abbreviation))
            return i.editReply({ embeds: [{ description: '**This abbreviation is already in use.** Remove it and try again.', color: red }], ephemeral: true });

        if (abbreviations.find(a => a.tag === formatTag(tag)))
            return i.editReply({ embeds: [{ description: '**This clan is already in use.** Remove it and try again.', color: red }], ephemeral: true });

        const clan = await getClan(tag).catch((e) => {
            if (e?.response?.status === 404) return i.editReply({ embeds: [{ description: '**Clan not found.**', color: red }], ephemeral: true });

            return i.editReply({ embeds: [{ description: e?.response?.statusText || 'Unexpected Error.', color: red }], ephemeral: true });
        });

        if (!clan) return;

        const abbrObj = {
            abbr: abbreviation,
            tag: clan.tag,
            name: clan.name
        }

        statistics.updateOne({}, { $inc: { totalAbbreviations: 1 } });
        await guilds.updateOne({ guildID: i.channel.guild.id }, { $push: { abbreviations: abbrObj } });

        const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies);
        const badgeEmoji = getEmoji(client, badgeName);

        return i.editReply({
            embeds: [{
                title: '✅ Abbreviation Set!',
                description: `**Clan**: ${badgeEmoji} ${clan.name}\n**Tag**: ${clan.tag}\n**Abbreviation**: \`${abbreviation}\``,
                color: green
            }]
        });
    }
};
