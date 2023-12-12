const { PermissionFlagsBits } = require("discord.js")
const { green, orange, red } = require("../static/colors")
const { getClan } = require("../util/api")
const { formatStr, formatTag } = require("../util/formatting")
const { errorMsg, getClanBadge } = require("../util/functions")
const { missingPermissionsToStr } = require("../util/validate")

module.exports = {
  data: {
    description: "Schedule a daily war report!",
    description_localizations: {
      de: "Planen Sie einen täglichen Kriegsbericht!",
      "es-ES": "¡Programe un informe de guerra diario!",
      fr: "Planifiez un rapport de guerre quotidien!",
      it: "Pianifica un rapporto di guerra giornaliero!",
      nl: "Plan een dagelijks oorlogsrapport!",
      tr: "Günlük savaş raporu planlayın!",
    },
    name: "schedule-report",
    name_localizations: {
      de: "bericht-planen",
      "es-ES": "programar-informe",
      fr: "planifier-rapport",
      it: "pianifica-rapporto",
      nl: "rapport-plannen",
      tr: "rapor-planla",
    },
    options: [
      {
        channel_types: [0], // text channels only
        description: "Select the channel to post daily war report.",
        description_localizations: {
          de: "Wählen Sie den Kanal, um den täglichen Kriegsbericht zu veröffentlichen.",
          "es-ES": "Seleccione el canal para publicar el informe de guerra diario.",
          fr: "Sélectionnez le canal pour publier le rapport de guerre quotidien.",
          it: "Seleziona il canale per pubblicare il rapporto di guerra giornaliero.",
          nl: "Selecteer het kanaal om het dagelijkse oorlogsrapport te plaatsen.",
          tr: "Günlük savaş raporunu yayınlamak için kanalı seçin.",
        },
        name: "channel",
        name_localizations: {
          de: "kanal",
          "es-ES": "canal",
          fr: "canal",
          it: "canale",
          nl: "kanaal",
          tr: "kanal",
        },
        required: true,
        type: 7,
      },
      {
        description: "Set the hour. (0-23)",
        description_localizations: {
          de: "Stelle die Stunde ein. (0-23)",
          "es-ES": "Establecer la hora. (0-23)",
          fr: "Définissez l'heure. (0-23)",
          it: "Imposta l'ora. (0-23)",
          nl: "Stel het uur in. (0-23)",
          tr: "Saati ayarlayın. (0-23)",
        },
        max_value: 23,
        min_value: 0,
        name: "hour",
        name_localizations: {
          de: "stunde",
          "es-ES": "hora",
          fr: "heure",
          it: "ora",
          nl: "uur",
          tr: "saat",
        },
        required: true,
        type: 4,
      },
      {
        description: "Set the minute. (0-59)",
        description_localizations: {
          de: "Stelle die Minute ein. (0-59)",
          "es-ES": "Establecer el minuto. (0-59)",
          fr: "Définissez la minute. (0-59)",
          it: "Imposta il minuto. (0-59)",
          nl: "Stel de minuut in. (0-59)",
          tr: "Dakikayı ayarlayın. (0-59)",
        },
        max_value: 59,
        min_value: 0,
        name: "minute",
        name_localizations: {
          de: "minute",
          "es-ES": "minuto",
          fr: "minute",
          it: "minuto",
          nl: "minuut",
          tr: "dakika",
        },
        required: true,
        type: 4,
      },
      {
        description: "Clan tag (#ABC123) or abbreviation",
        description_localizations: {
          de: "Clan-Tag (#ABC123) oder Abkürzung",
          "es-ES": "Etiqueta del clan (#ABC123) o abreviatura",
          fr: "Tag du clan (#ABC123) ou abréviation",
          it: "Tag del clan (#ABC123) o abbreviazione",
          nl: "Clan tag (#ABC123) of afkorting",
          tr: "Klan etiketi (#ABC123) veya kısaltma",
        },
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          "es-ES": "etiqueta",
          fr: "balise",
          it: "tag",
          nl: "tag",
          tr: "etiket",
        },
        required: false,
        type: 3,
      },
    ],
  },
  run: async (i, db, client) => {
    const guilds = db.collection("Guilds")

    const iHour = i.options.getInteger("hour")
    const iMinute = i.options.getInteger("minute")
    const iChannel = i.options.getChannel("channel")

    const guild = await guilds.findOne({
      guildID: i.guildId,
    })

    let tag = i.options.getString("tag")

    // default clan
    if (!tag) {
      if (guild?.defaultClan?.tag) tag = guild.defaultClan.tag
      else
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: "**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me).",
            },
          ],
        })
    } else {
      // abbreviation
      const UPPERCASE_ABBR = tag.toUpperCase()
      const abbr = guild?.abbreviations?.find((a) => a.abbr.toUpperCase() === UPPERCASE_ABBR)

      if (abbr) tag = abbr.tag
      else if (tag.length < 5) {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: "**Abbreviation does not exist.**",
            },
          ],
        })
      }
    }

    const reportChannelPermissions = client.channels.cache.get(iChannel.id).permissionsFor(client.user)
    const requiredFlags = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.UseExternalEmojis,
      PermissionFlagsBits.AttachFiles,
    ]

    if (!reportChannelPermissions.has(requiredFlags)) {
      return i.editReply({
        embeds: [
          {
            color: red,
            description: `**Missing Permissions in** <#${iChannel.id}>:\n${missingPermissionsToStr(
              reportChannelPermissions,
              requiredFlags,
            )}`,
          },
        ],
      })
    }

    const HH = iHour < 10 ? `0${iHour}` : iHour
    const MM = iMinute < 10 ? `0${iMinute}` : iMinute
    const HHMM = `${HH}:${MM}`

    // check if clan exists
    const { data: clan, error } = await getClan(tag)

    if (error) return errorMsg(i, error)

    guilds.updateOne(guild, {
      $set: {
        "channels.reportChannelID": iChannel.id,
        warReport: {
          clanTag: formatTag(tag),
          enabled: true,
          scheduledReportTimeHHMM: HHMM,
        },
      },
    })

    const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    const badgeEmoji = client.cwEmojis.get(badgeName)

    return i.editReply({
      embeds: [
        {
          color: green,
          description: `**Clan**: ${badgeEmoji} ${formatStr(clan.name)}\n**Tag**: ${
            clan.tag
          }\n**UTC Time**: ${HHMM}:00 (Fri-Mon)\n**Channel**: <#${iChannel.id}>`,
          title: "✅ Daily War Report Set!",
        },
      ],
    })
  },
}
