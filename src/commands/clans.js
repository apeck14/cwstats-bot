const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js")
const { getAllPlusClanTags, getLinkedClansByGuild, getRiverRace, setCooldown } = require("../util/services")
const { getClanBadge } = require("../util/functions")
const { getRaceDetails } = require("../util/raceFunctions")
const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
  cooldown: true,
  data: {
    description: "View real-time race data for all clans linked to your server.",
    description_localizations: {
      de: "Zeige Echtzeit-Renndaten für alle verknüpften Clans in deinem Server an.",
      "es-ES": "Ve datos de carrera en tiempo real para todos los clanes vinculados en tu servidor.",
      fr: "Affichez les données de course en temps réel pour tous les clans liés sur votre serveur.",
      it: "Visualizza i dati di gara in tempo reale per tutti i clan collegati nel tuo server.",
      nl: "Bekijk realtime racedata voor alle gekoppelde clans in je server.",
      tr: "Sunucunuzdaki tüm bağlı klanlar için gerçek zamanlı yarış verilerini görüntüleyin.",
    },
    name: "clans",
    name_localizations: {
      de: "clans",
      "es-ES": "clanes",
      fr: "clans",
      it: "clan",
      nl: "clans",
      tr: "klanlar",
    },
  },
  run: async (i, db, client) => {
    const DailyLb = db.collection("Daily Clan Leaderboard")

    const [linkedClans, dailyLeaderboard, plusTags] = await Promise.all([
      getLinkedClansByGuild(db, i.guildId),
      DailyLb.find({}).toArray(),
      getAllPlusClanTags(db),
    ])

    const liveClanData = []

    // show AVG | DECKS REMAINING | PROJ. PLACE

    for (const c of linkedClans) {
      try {
        const isPlus = plusTags.includes(c.tag)

        // get live race data
        if (isPlus) {
          const { data: race } = await getRiverRace(c.tag)
          const { clans, periodIndex } = getRaceDetails(race)
          const dayOfWeek = periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)
          const isTraining = dayOfWeek <= 2

          const { badgeId, crossedFinishLine, decksRemaining, fameAvg, projPlace, trophies } = clans.find(
            (cl) => cl.tag === c.tag,
          )

          liveClanData.push({
            badgeEmoji: getClanBadge(badgeId, trophies),
            crossedFinishLine,
            decksRemaining,
            fameAvg,
            isPlus: true,
            isTraining,
            name: c.clanName,
            projPlace: projPlace || "N/A",
            tag: c.tag,
            trophies,
          })

          continue
        }

        const clan = dailyLeaderboard.find((cl) => cl.tag === c.tag)

        // check daily leaderboard
        if (clan) {
          liveClanData.push({
            badgeEmoji: getClanBadge(clan.badgeId, clan.clanScore),
            crossedFinishLine: clan.boatPoints >= 10000,
            decksRemaining: clan.decksRemaining,
            fameAvg: clan.fameAvg,
            isPlus: false,
            isTraining: clan.isTraining,
            name: c.clanName,
            projPlace: clan.projPlacement || "N/A",
            tag: c.tag,
            trophies: clan.clanScore,
          })

          continue
        }

        // clans that won't show data (non-plus & not on daily leaderboard)
        liveClanData.push({
          badgeEmoji: c.clanBadge.replace(/-/g, ""),
          name: c.clanName,
          noData: true,
          tag: c.tag,
        })
      } catch (e) {
        console.log(c.tag, e)
        continue
      }
    }

    liveClanData.sort((a, b) => {
      // Move noData: true clans to the end, then sort them alphabetically by name
      if (a.noData && !b.noData) return 1
      if (b.noData && !a.noData) return -1
      if (a.noData && b.noData) {
        return a.name.localeCompare(b.name)
      }

      // Sort by isPlus first (true first, false second)
      if (a.isPlus !== b.isPlus) {
        return b.isPlus - a.isPlus
      }

      // Sort by trophies in descending order
      return (b.trophies || 0) - (a.trophies || 0)
    })

    let page = 0
    const itemsPerPage = 5

    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const projectionEmoji = client.cwEmojis.get("projection")
    const fameAvgEmoji = client.cwEmojis.get("fameAvg")
    const flagEmoji = client.cwEmojis.get("flag")
    const plusEmoji = client.cwEmojis.get("cwstats_plus")

    const generateEmbed = (pageIndex) => {
      const start = pageIndex * itemsPerPage
      const end = start + itemsPerPage
      const pageData = liveClanData.slice(start, end)

      const description = !liveClanData.length
        ? `No clans linked to this server. You can link your clans [**here**](https://cwstats.com/me/servers/${i.guildId}/clans).`
        : pageData
            .map((c) => {
              const badgeEmoji = client.cwEmojis.get(c.badgeEmoji)
              const url = `https://www.cwstats.com/clan/${c.tag.substring(1)}/race`

              let entry = `${badgeEmoji} [**${formatStr(c.name)}**](${url})${c.isPlus ? ` ${plusEmoji}` : ""}`

              if (c.isTraining || c.noData) return entry
              if (c.crossedFinishLine) {
                entry += `\n${flagEmoji} *Crossed finish line*`
                return entry
              }

              entry += `\n${projectionEmoji} **${c.projPlace}** ${fameAvgEmoji} **${c.fameAvg.toFixed(2)}** ${decksRemainingEmoji} **${c.decksRemaining}**`
              return entry
            })
            .join("\n\n")

      const embed = new EmbedBuilder()
        .setTitle(`__Live River Races__`)
        .setDescription(description)
        .setThumbnail(i.guild.iconURL({ dynamic: true, size: 1024 }))
        .setColor(pink)

      // set pages footer
      if (liveClanData.length) {
        embed.setFooter({
          text: `Page ${pageIndex + 1} of ${Math.ceil(liveClanData.length / itemsPerPage)}`,
        })

        // set cooldown timestamp (now + 1 min)
        setCooldown(db, i.guildId, "clans", 60000)
      }

      return embed
    }

    const generateButtons = (pageIndex) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === 0),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex >= Math.ceil(liveClanData.length / itemsPerPage) - 1),
      )

    const message = await i.editReply({
      components: [generateButtons(page)],
      embeds: [generateEmbed(page)],
      fetchReply: true,
    })

    const collector = message.createMessageComponentCollector({ time: 60000 })

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return

      if (interaction.customId === "prev_page" && page > 0) page--
      if (interaction.customId === "next_page" && page < Math.ceil(liveClanData.length / itemsPerPage) - 1) page++

      await interaction.update({
        components: [generateButtons(page)],
        embeds: [generateEmbed(page)],
      })
    })

    collector.on("end", async () => {
      await message.edit({ components: [] }) // Remove buttons when expired
    })
  },
}
