const { PermissionFlagsBits } = require("discord.js")
const { green, orange, red } = require("../static/colors")
const { getClan } = require("../util/api")
const { formatTag, formatStr } = require("../util/formatting")
const { errorMsg, getClanBadge, getEmoji } = require("../util/functions")
const { missingPermissionsToStr } = require("../util/validate")

module.exports = {
	data: {
		name: "schedule-report",
		description: "Set daily war report clan, channel & time (UTC).",
		options: [
			{
				type: 3,
				name: "tag",
				description: "#CLANTAG or abbreviation",
				required: true,
			},
			{
				type: 7,
				name: "channel",
				description: "Set the channel to post daily war report.",
				required: true,
				channel_types: [0], //text channels only
			},
			{
				type: 4,
				name: "hour",
				description: "Set the hour. (0-23)",
				required: true,
				min_value: 0,
				max_value: 23,
			},
			{
				type: 4,
				name: "minute",
				description: "Set the minute. (0-59)",
				required: true,
				min_value: 0,
				max_value: 59,
			}
		],
		userPermissions: ["MANAGE_GUILD"],
	},
	run: async (i, db, client) => {
		const guilds = db.collection("Guilds")

		const iHour = i.options.getInteger("hour")
		const iMinute = i.options.getInteger("minute")
		const iChannel = i.options.getChannel("channel")

		const guild = await guilds.findOne({
			guildID: i.guildId
		})

		let tag = i.options.getString("tag")
		const abbr = guild?.abbreviations?.find((a) => a.abbr === tag)

		if (abbr) tag = abbr.tag
		else if (tag.length < 5) {
			return i.editReply({
				embeds: [
					{
						description: "**Abbreviation does not exist.**",
						color: orange
					}
				],
			})
		}

		const reportChannelPermissions = client.channels.cache.get(iChannel.id).permissionsFor(client.user)
		const requiredFlags = [
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.UseExternalEmojis
		]

		if (!reportChannelPermissions.has(requiredFlags)) {
			return i.editReply({
				embeds: [
					{
						description: `**Missing Permissions in** <#${iChannel.id}>:\n` + missingPermissionsToStr(reportChannelPermissions, requiredFlags),
						color: red,
					}
				],
			})
		}

		const HH = iHour < 10 ? `0${iHour}` : iHour
		const MM = iMinute < 10 ? `0${iMinute}` : iMinute
		const HHMM = `${HH}:${MM}`

		//check if clan exists
		const { data: clan, error } = await getClan(tag)

		if (error) return errorMsg(i, error)

		guilds.updateOne(guild, {
			$set: {
				"warReport": {
					enabled: true,
					clanTag: formatTag(tag),
					scheduledReportTimeHHMM: HHMM,
				},
				"channels.reportChannelID": iChannel.id,
			},
		})

		const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
		const badgeEmoji = getEmoji(badgeName)

		return i.editReply({
			embeds: [
				{
					title: "✅ Daily War Report Set!",
					description: `**Clan**: ${badgeEmoji} ${formatStr(clan.name)}\n**Tag**: ${clan.tag}\n**UTC Time**: ${HHMM}:00 (Fri-Mon)\n**Channel**: <#${iChannel.id}>`,
					color: green,
					footer: {
						text: "Use /toggle-report to disable war report at any time.",
					},
				}
			],
		})
	},
}