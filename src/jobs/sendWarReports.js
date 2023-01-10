const { pink, red } = require("../static/colors")
const { getClan, getRiverRace } = require("../util/api")
const { formatStr } = require("../util/formatting")
const { getClanBadge, getEmoji } = require("../util/functions")
const { getAvgFame } = require("../util/raceFunctions")

module.exports = {
	expression: "* * * * 5,6,7,1", //every min Fri - Mon
	run: async (client, db) => {
		const guilds = db.collection("Guilds")

		const now = new Date()
		const currentHH = now.getUTCHours() < 10 ? `0${now.getUTCHours()}` : now.getUTCHours()
		const currentMM = now.getUTCMinutes() < 10 ? `0${now.getUTCMinutes()}` : now.getUTCMinutes()

		const guildsToSendReport = await guilds
			.find({
				"warReport.enabled": true,
				"warReport.scheduledReportTimeHHMM": `${currentHH}:${currentMM}`,
			})
			.toArray()

		const guildsPromises = guildsToSendReport.map((g) => getRiverRace(g.warReport.clanTag))
		const guildsRaceData = await Promise.all(guildsPromises)

		const guildsClanPromises = guildsToSendReport.map((g) => getClan(g.warReport.clanTag))
		const guildsClanData = await Promise.all(guildsClanPromises)

		for (const res of guildsRaceData) {
			try {
				const { data: race, error } = res

				if (error || !race) continue

				const { data: clan, error: clanError } = guildsClanData.find((res) => res.data.tag === race.clan.tag)

				if (clanError || !clan) continue

				const { channels } = guildsToSendReport.find((g) => g.warReport.clanTag === race.clan.tag)
				const { reportChannelID } = channels

				const reportChannelPermissions = client.channels.cache.get(reportChannelID).permissionsFor(client.user).toArray()
				const requiredPerms = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
				const missingPerms = requiredPerms.filter((p) => !reportChannelPermissions.includes(p))

				if (missingPerms.length > 0) continue

				if (race.periodType === "training") {
					client.channels.cache.get(reportChannelID).send({
						embeds: [
							{
								color: red,
								title: `__Daily War Report__`,
								description: "No race data found! Use **/schedule-report** to update the scheduled time. Make sure the time is right *before* war day reset.",
							},
						],
					})
					continue
				}

				// send report
				const isColosseum = race.periodType === "colosseum"
				const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

				const embed = {
					color: pink,
					title: `__Daily War Report__`,
					thumbnail: {
						url: "https://i.imgur.com/VAPR8Jq.png",
					},
					author: {
						name: `Week ${race.sectionIndex + 1} Day ${dayOfWeek < 3 ? dayOfWeek + 1 : dayOfWeek - 2}`,
					},
					description: "",
				}

				const badgeName = getClanBadge(race.clan.badgeId, race.clan.clanScore)
				const badgeEmoji = getEmoji(badgeName)
				const fameEmoji = getEmoji("fame")
				const fameAvgEmoji = getEmoji("fameAvg")
				const decksRemainingEmoji = getEmoji("decksRemaining")

				const fameAccessor = isColosseum ? "fame" : "periodPoints"
				const decksRemaining = 200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0)

				embed.description += `${badgeEmoji} **${formatStr(race.clan.name)}**`
				embed.description += `\n${fameEmoji} ${race.clan[fameAccessor]}`
				embed.description += `\n${fameAvgEmoji} ${getAvgFame(race.clan, isColosseum, dayOfWeek).toFixed(2)}`
				embed.description += `\n${decksRemainingEmoji} ${decksRemaining}\n`

				const fourAttacks = []
				const threeAttacks = []
				const twoAttacks = []
				const oneAttack = []

				let showFooter = false

				for (const p of race.clan.participants) {
					//push all players to appropiate array
					const inClan = clan.memberList.find((m) => m.tag === p.tag)

					if (p.decksUsedToday === 0 && inClan) fourAttacks.push(p)
					else if (p.decksUsedToday === 1) {
						if (!inClan) {
							p.name += "*"
							showFooter = true
						}
						threeAttacks.push(p)
					} else if (p.decksUsedToday === 2) {
						if (!inClan) {
							p.name += "*"
							showFooter = true
						}
						twoAttacks.push(p)
					} else if (p.decksUsedToday === 3) {
						if (!inClan) {
							p.name += "*"
							showFooter = true
						}
						oneAttack.push(p)
					}
				}

				fourAttacks.sort((a, b) => a.name.localeCompare(b.name))
				threeAttacks.sort((a, b) => a.name.localeCompare(b.name))
				twoAttacks.sort((a, b) => a.name.localeCompare(b.name))
				oneAttack.sort((a, b) => a.name.localeCompare(b.name))

				if (fourAttacks.length > 0) embed.description += `\n**__4 Attacks__**\n${fourAttacks.map((p) => `• ${formatStr(p.name)}\n`).join("")}`
				if (threeAttacks.length > 0) embed.description += `\n**__3 Attacks__**\n${threeAttacks.map((p) => `• ${formatStr(p.name)}\n`).join("")}`
				if (twoAttacks.length > 0) embed.description += `\n**__2 Attacks__**\n${twoAttacks.map((p) => `• ${formatStr(p.name)}\n`).join("")}`
				if (oneAttack.length > 0) embed.description += `\n**__1 Attack__**\n${oneAttack.map((p) => `• ${formatStr(p.name)}\n`).join("")}`

				if (showFooter) {
					embed.footer = { text: "* = Not in clan" }
				}

				client.channels.cache.get(reportChannelID).send({ embeds: [embed] })
			} catch (err) {
				console.log(err)
				continue
			}
		}
	},
}
