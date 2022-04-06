const { getPlayer, getClan, getPlayerRanking } = require("../util/api")
const { pink, green } = require("../static/colors")
const { getClanBadge, getEmoji, getArenaEmoji, formatTag } = require("../util/functions")
const { createCanvas, registerFont, loadImage } = require("canvas")
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

		const player = await getPlayer(tag).catch(async (e) => {
			if (e?.response?.status === 404) throw "**Player not found.**"

			throw e?.response?.statusText || "Unexpected Error."
		})

		const [playerRank, arenaImage] = await Promise.all([
			getPlayerRanking(player.tag),
			loadImage(`./src/static/images/arenas/${getArenaEmoji(player.trophies)}.png`),
		])
		const canvas = createCanvas(arenaImage.width, arenaImage.height)
		const context = canvas.getContext("2d")

		context.drawImage(arenaImage, 0, 0, canvas.width, canvas.height)

		//add global rank
		if (playerRank) {
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
			const clan = await getClan(player.clan.tag)
			clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
		}

		const badgeEmoji = getEmoji(client, clanBadge)
		const levelEmoji = getEmoji(client, `level${player.expLevel}`)
		const ladderEmoji = getEmoji(client, getArenaEmoji(player.trophies))
		const pbEmoji = getEmoji(client, getArenaEmoji(player.bestTrophies))
		const level14 = getEmoji(client, "level14c")
		const level13 = getEmoji(client, `level13`)
		const level12 = getEmoji(client, `level12`)
		const level11 = getEmoji(client, `level11`)

		const ccWins = player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
		const gcWins = player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
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

		applicationEmbed.description += `${levelEmoji} [**${player.name}**](https://royaleapi.com/player/${formatTag(tag).substr(1)})\n`
		applicationEmbed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n${badgeEmoji} **${player.clan.name}**\n\n` //clan & ladder
		applicationEmbed.description += `**__Stats__**\n**CW1 War Wins**: ${player.warDayWins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n` //stats
		applicationEmbed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}` //cards
		applicationEmbed.description += `\n\n**Request By**: ${`<@!${i.user.id}>`}`

		i.editReply({
			embeds: [
				{
					color: green,
					description: `✅ Request sent for **${player.name}**! A Co-Leader will contact you shortly.`,
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
