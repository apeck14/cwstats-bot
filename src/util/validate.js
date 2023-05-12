const { PermissionFlagsBits, PermissionsBitField } = require("discord.js")
const startCase = require("lodash/startCase")
const { orange, red } = require("../static/colors")

const missingPermissionsToStr = (permissions, requiredFlags) => {
  const serializedPermissions = permissions.serialize()
  const requiredPermissionsArr = new PermissionsBitField(
    requiredFlags
  ).toArray()

  let str = ""

  for (const perm of requiredPermissionsArr) {
    if (!serializedPermissions[perm]) str += `❌ \`${startCase(perm)}\`\n`
  }

  return str
}

const checkPermissions = (i, channels, client) => {
  const { applicationsChannelID } = channels

  if (i.commandName === "apply") {
    const applicationsChannelPermissions = client.channels.cache
      .get(applicationsChannelID)
      .permissionsFor(client.user)

    const requiredFlags = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.UseExternalEmojis,
    ]

    if (!applicationsChannelPermissions.has(requiredFlags)) {
      return {
        error: `**Missing permissions in** <#${applicationsChannelID}>.\n\n${missingPermissionsToStr(
          applicationsChannelPermissions,
          requiredFlags
        )}`,
      }
    }
  } else {
    const ADMIN_COMMANDS = ["schedule-report"]

    if (
      i.user.id !== "493245767448789023" &&
      ADMIN_COMMANDS.includes(i.commandName)
    ) {
      const isAdmin = i.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )

      if (!isAdmin) {
        return {
          error: "**You do not have permissions to use this command.**",
        }
      }
    }

    const channelPermissions = client.channels.cache
      .get(i.channelId)
      .permissionsFor(client.user)

    const requiredFlags = [PermissionFlagsBits.UseExternalEmojis]

    if (!channelPermissions.has(requiredFlags)) {
      return {
        error: `__**Missing permissions**__\n\n${missingPermissionsToStr(
          channelPermissions,
          requiredFlags
        )}`,
      }
    }
  }

  return {}
}

const validate = (i, channels, client) => {
  const { applyChannelID, applicationsChannelID, commandChannelIDs } = channels
  const channelId = i.channelId

  const color = orange
  let onlyShowToUser = false

  if (i.commandName === "apply") {
    let error = ""

    if (!applyChannelID) error = "**No apply channel set.**"
    else if (applyChannelID !== channelId) {
      error = `You can only use this command in the set **apply channel**! (<#${applyChannelID}>)`
      onlyShowToUser = true
    } else if (!applicationsChannelID)
      error = "**No applications channel set.**"

    return {
      color,
      error,
      onlyShowToUser,
    }
  }

  if (commandChannelIDs.length > 0 && !commandChannelIDs.includes(channelId)) {
    return {
      color,
      error: `You can only use this command in a set **command channel**!`,
      onlyShowToUser: true,
    }
  }

  const { error } = checkPermissions(i, channels, client)

  if (error) {
    return {
      color: red,
      error,
      onlyShowToUser,
    }
  }

  return {}
}

module.exports = {
  validate,
  missingPermissionsToStr,
}
