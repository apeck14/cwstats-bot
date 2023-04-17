const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    name: "info",
    description: "View server info and abbreviations.",
  },
  run: async (i, db, client) => {
    const guilds = db.collection("Guilds")

    const { abbreviations, channels, warReport } = await guilds.findOne({
      guildID: i.guildId,
    })
    const {
      commandChannelID,
      applyChannelID,
      applicationsChannelID,
      reportChannelID,
    } = channels
    const cmdChnl = commandChannelID ? `<#${commandChannelID}>` : "N/A"
    const applyChnl = applyChannelID ? `<#${applyChannelID}>` : "N/A"
    const appChnl = applicationsChannelID
      ? `<#${applicationsChannelID}>`
      : "N/A"
    const reportChnl = reportChannelID ? `<#${reportChannelID}>` : "N/A"

    const embed = {
      description: "",
      color: pink,
    }

    embed.description += `**__Channels__**\n**Commands**: ${cmdChnl}\n**Apply**: ${applyChnl}\n**Applications**: ${appChnl}\n**War Report**: ${reportChnl}\n\n`

    if (warReport) {
      const { enabled, clanTag, scheduledReportTimeHHMM } = warReport
      const enabledStr = enabled ? "Yes" : "No"
      embed.description += `**__War Report__**\n**Enabled**: ${enabledStr}\n**Time**: ${scheduledReportTimeHHMM} (UTC)\n**Clan Tag**: ${clanTag}\n\n`
    }

    if (abbreviations?.length > 0) {
      abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr))

      embed.description += `**__Abbreviations__**`
      embed.description += `${abbreviations
        .map((a) => `\n• \`${a.abbr}\`: ${formatStr(a.name)}`)
        .join("")}`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
