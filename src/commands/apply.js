const { getPlayer, getClan } = require("../util/api")
const { pink, green } = require("../static/colors")
const { getClanBadge, getEmoji, getArenaEmoji, errorMsg } = require("../util/functions")
const { createCanvas, registerFont, loadImage } = require("canvas")
const { formatStr, formatRole, formatTag } = require("../util/formatting")
registerFont("./src/static/fonts/Supercell-Magic.ttf", { family: "Supercell-Magic" })

module.exports = {
	data: {
		name: "apply",
		description: "Apply to join the clan.",
		options: [
			{
				type: 3,
				name: "tag",
				description: "#PLAYERTAG",
				required: true,
			},
		],
	},
	run: async (i, db, client) => {
		const guilds = db.collection("Guilds")
		const { channels } = await guilds.findOne({ guildID: i.channel.guild.id })
		const { applicationsChannelID } = channels

		let tag = i.options.getString("tag")

		const { data: player, error: playerError } = await getPlayer(tag)

		if (playerError) return errorMsg(i, playerError)

		const playerRank = player.leagueStatistics?.currentSeason?.rank
		const arenaImage = await loadImage(`./src/static/images/arenas/${getArenaEmoji(player.trophies)}.png`)

		const canvas = createCanvas(arenaImage.width, arenaImage.height)
		const context = canvas.getContext("2d")

		context.drawImage(arenaImage, 0, 0, canvas.width, canvas.height)

		//add global rank
		if (playerRank > -1) {
			const fontSize = () => {
				if (playerRank < 10) return 130
				if (playerRank < 1000) return 115
				return 90
			}

			context.font = `${fontSize()}px Supercell-Magic`

			const textWidth = context.measureText(playerRank).width
			const [tX, tY] = [(arenaImage.width - textWidth) / 2, arenaImage.height / 2 + 15]
			const [oX, oY] = [tX + 4, tY + 6]

			context.fillStyle = "black"
			context.fillText(playerRank, oX, oY)

			context.fillStyle = "white"
			context.fillText(playerRank, tX, tY)
		}

		let clanBadge

		if (!player.clan) {
			player.clan = { name: "None" }
			clanBadge = getClanBadge(-1)
		} else {
			//get clan badge
			const { data: clan, error: clanError } = await getClan(player.clan.tag)

			if (clanError) return errorMsg(i, clanError)

			clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
		}

		const badgeEmoji = getEmoji(clanBadge)
		const levelEmoji = getEmoji(`level${player.expLevel}`)
		const ladderEmoji = getEmoji(getArenaEmoji(player.trophies))
		const pbEmoji = getEmoji(getArenaEmoji(player.bestTrophies))
		const level14 = getEmoji("level14")
		const level13 = getEmoji(`level13`)
		const level12 = getEmoji(`level12`)
		const level11 = getEmoji(`level11`)

		const ccWins = player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
		const gcWins = player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
		const cw2Wins = player.badges.find((b) => b.name === "ClanWarWins")?.progress || 0
		const lvl14Cards = player.cards.filter((c) => c.maxLevel - c.level === 0).length
		const lvl13Cards = player.cards.filter((c) => c.maxLevel - c.level === 1).length
		const lvl12Cards = player.cards.filter((c) => c.maxLevel - c.level === 2).length
		const lvl11Cards = player.cards.filter((c) => c.maxLevel - c.level === 3).length

		const applicationEmbed = {
			color: pink,
			title: "__New Application!__",
			description: ``,
			thumbnail: {
				url: "attachment://arena.png",
			},
		}

		applicationEmbed.description += `${levelEmoji} [**${formatStr(player.name)}**](https://royaleapi.com/player/${formatTag(tag).substr(1)})\n`
		applicationEmbed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n${badgeEmoji} **${formatStr(player.clan.name)}**${
			player.role ? ` (${formatRole(player.role)})` : ""
		}\n\n` //clan & ladder
		applicationEmbed.description += `**__Stats__**\n**CW1 Wins**: ${player.warDayWins}\n**CW2 Wins**: ${cw2Wins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n` //stats
		applicationEmbed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}` //cards
		applicationEmbed.description += `\n\n**Request By**: ${`<@!${i.user.id}>`}`

		i.editReply({
			embeds: [
				{
					color: green,
					description: `✅ Request sent for **${formatStr(player.name)}**! A Co-Leader will contact you shortly.`,
				},
			],
		})

		return client.channels.cache.get(applicationsChannelID).send({
			embeds: [applicationEmbed],
			files: [
				{
					attachment: canvas.toBuffer(),
					name: "arena.png",
				},
			],
		})
	},
}
