const { PermissionFlagsBits } = require("discord.js")
const { green, orange, red } = require("../static/colors")
const { getClan } = require("../util/api")
const { formatTag, formatStr } = require("../util/formatting")
const { errorMsg, getClanBadge } = require("../util/functions")
const { missingPermissionsToStr } = require("../util/validate")

module.exports = {
  data: {
    name: "schedule-report",
    name_localizations: {
      de: "bericht-planen",
      fr: "planifier-rapport",
      "es-ES": "programar-informe",
      tr: "rapor-planla",
      it: "pianifica-rapporto",
      nl: "rapport-plannen",
    },
    description: "Schedule a daily war report!",
    description_localizations: {
      de: "Planen Sie einen täglichen Kriegsbericht!",
      fr: "Planifiez un rapport de guerre quotidien!",
      "es-ES": "¡Programe un informe de guerra diario!",
      tr: "Günlük savaş raporu planlayın!",
      it: "Pianifica un rapporto di guerra giornaliero!",
      nl: "Plan een dagelijks oorlogsrapport!",
    },
    options: [
      {
        type: 7,
        name: "channel",
        name_localizations: {
          de: "kanal",
          fr: "canal",
          "es-ES": "canal",
          tr: "kanal",
          it: "canale",
          nl: "kanaal",
        },
        description: "Select the channel to post daily war report.",
        description_localizations: {
          de: "Wählen Sie den Kanal, um den täglichen Kriegsbericht zu veröffentlichen.",
          fr: "Sélectionnez le canal pour publier le rapport de guerre quotidien.",
          "es-ES":
            "Seleccione el canal para publicar el informe de guerra diario.",
          tr: "Günlük savaş raporunu yayınlamak için kanalı seçin.",
          it: "Seleziona il canale per pubblicare il rapporto di guerra giornaliero.",
          nl: "Selecteer het kanaal om het dagelijkse oorlogsrapport te plaatsen.",
        },
        required: true,
        channel_types: [0], //text channels only
      },
      {
        type: 4,
        name: "hour",
        name_localizations: {
          de: "stunde",
          fr: "heure",
          "es-ES": "hora",
          tr: "saat",
          it: "ora",
          nl: "uur",
        },
        description: "Set the hour. (0-23)",
        description_localizations: {
          de: "Stelle die Stunde ein. (0-23)",
          fr: "Définissez l'heure. (0-23)",
          "es-ES": "Establecer la hora. (0-23)",
          tr: "Saati ayarlayın. (0-23)",
          it: "Imposta l'ora. (0-23)",
          nl: "Stel het uur in. (0-23)",
        },
        required: true,
        min_value: 0,
        max_value: 23,
      },
      {
        type: 4,
        name: "minute",
        name_localizations: {
          de: "minute",
          fr: "minute",
          "es-ES": "minuto",
          tr: "dakika",
          it: "minuto",
          nl: "minuut",
        },
        description: "Set the minute. (0-59)",
        description_localizations: {
          de: "Stelle die Minute ein. (0-59)",
          fr: "Définissez la minute. (0-59)",
          "es-ES": "Establecer el minuto. (0-59)",
          tr: "Dakikayı ayarlayın. (0-59)",
          it: "Imposta il minuto. (0-59)",
          nl: "Stel de minuut in. (0-59)",
        },
        required: true,
        min_value: 0,
        max_value: 59,
      },
      {
        type: 3,
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          fr: "balise",
          "es-ES": "etiqueta",
          tr: "etiket",
          it: "tag",
          nl: "tag",
        },
        description: "Clan tag (#ABC123) or abbreviation",
        description_localizations: {
          de: "Clan-Tag (#ABC123) oder Abkürzung",
          fr: "Tag du clan (#ABC123) ou abréviation",
          "es-ES": "Etiqueta del clan (#ABC123) o abreviatura",
          tr: "Klan etiketi (#ABC123) veya kısaltma",
          it: "Tag del clan (#ABC123) o abbreviazione",
          nl: "Clan tag (#ABC123) of afkorting",
        },
        required: false,
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

    //default clan
    if (!tag) {
      if (guild?.defaultClan?.tag) tag = guild.defaultClan.tag
      else
        return i.editReply({
          embeds: [
            {
              description:
                "**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me).",
              color: orange,
            },
          ],
        })
    } else {
      //abbreviation
      const UPPERCASE_ABBR = tag.toUpperCase()
      const abbr = guild?.abbreviations?.find(
        (a) => a.abbr.toUpperCase() === UPPERCASE_ABBR
      )

      if (abbr) tag = abbr.tag
      else if (tag.length < 5) {
        return i.editReply({
          embeds: [
            {
              description: "**Abbreviation does not exist.**",
              color: orange,
            },
          ],
        })
      }
    }

    const reportChannelPermissions = client.channels.cache
      .get(iChannel.id)
      .permissionsFor(client.user)
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
            description:
              `**Missing Permissions in** <#${iChannel.id}>:\n` +
              missingPermissionsToStr(reportChannelPermissions, requiredFlags),
            color: red,
          },
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
        warReport: {
          enabled: true,
          clanTag: formatTag(tag),
          scheduledReportTimeHHMM: HHMM,
        },
        "channels.reportChannelID": iChannel.id,
      },
    })

    const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    const badgeEmoji = client.cwEmojis.get(badgeName)

    return i.editReply({
      embeds: [
        {
          title: "✅ Daily War Report Set!",
          description: `**Clan**: ${badgeEmoji} ${formatStr(
            clan.name
          )}\n**Tag**: ${
            clan.tag
          }\n**UTC Time**: ${HHMM}:00 (Fri-Mon)\n**Channel**: <#${
            iChannel.id
          }>`,
          color: green,
        },
      ],
    })
  },
}
