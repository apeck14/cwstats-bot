const { PermissionFlagsBits, PermissionsBitField } = require("discord.js")
const startCase = require("lodash/startCase")
const { orange, red } = require("../static/colors")

const missingPermissionsToStr = (permissions, requiredFlags) => {
  const serializedPermissions = permissions.serialize()
  const requiredPermissionsArr = new PermissionsBitField(requiredFlags).toArray()

  let str = ""

  for (const perm of requiredPermissionsArr) {
    if (!serializedPermissions[perm]) str += `❌ \`${startCase(perm)}\`\n`
  }

  return str
}

const ADMIN_COMMANDS = ["nudge", "Link Player (ADMIN)", "Unlink Player (ADMIN)"]

const checkPermissions = (i, guild, client) => {
  const { adminRoleID, channels } = guild
  const { applicationsChannelID } = channels

  if (i.commandName === "apply") {
    const applicationsChannelPermissions = client.channels.cache.get(applicationsChannelID).permissionsFor(client.user)

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
          requiredFlags,
        )}`,
      }
    }
  } else {
    const isNotMe = i.user.id !== "493245767448789023"
    const isAdminCommand = ADMIN_COMMANDS.includes(i.commandName)

    if (isNotMe && isAdminCommand) {
      const hasPermissions = i.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      const hasAdminRole = adminRoleID && i.member.roles.cache.has(adminRoleID)

      if (!hasPermissions && !hasAdminRole) {
        return {
          error: "**You do not have permissions to use this command.**",
        }
      }
    }

    const channel = client.channels.cache.get(i.channelId)

    if (!channel)
      return {
        error: "**Channel not found.**",
      }

    const channelPermissions = channel.permissionsFor(client.user)

    const requiredFlags = [PermissionFlagsBits.UseExternalEmojis]

    if (!channelPermissions.has(requiredFlags)) {
      return {
        error: `__**Missing permissions**__\n\n${missingPermissionsToStr(channelPermissions, requiredFlags)}`,
      }
    }
  }

  return {}
}

const validate = (i, guild, client, ignoreChannelChecks) => {
  const { applicationsChannelID, applyChannelID, commandChannelIDs, commandChannelKeyword } = guild.channels
  const { channelId } = i

  const color = orange
  let onlyShowToUser = false

  if (!ignoreChannelChecks) {
    if (i.commandName === "apply") {
      let error = ""

      if (!applyChannelID) error = "**No apply channel set.**"
      else if (applyChannelID !== channelId) {
        error = `You can only use this command in the set **apply channel**! (<#${applyChannelID}>)`
        onlyShowToUser = true
      } else if (!applicationsChannelID) error = "**No applications channel set.**"

      return {
        color,
        error,
        onlyShowToUser,
      }
    }

    const notCommandChannelEmbed = {
      color,
      error: `You can only use this command in a set **command channel**!`,
      onlyShowToUser: true,
    }

    let showCommandChannelEmbed = true

    if (commandChannelIDs?.length === 0 && !commandChannelKeyword) showCommandChannelEmbed = false
    else if (commandChannelIDs?.length > 0 && commandChannelIDs.includes(channelId)) showCommandChannelEmbed = false
    else if (commandChannelKeyword && i.channel.name.includes(commandChannelKeyword)) showCommandChannelEmbed = false

    if (showCommandChannelEmbed) return notCommandChannelEmbed
  }

  const { error } = checkPermissions(i, guild, client)

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
  missingPermissionsToStr,
  validate,
}
