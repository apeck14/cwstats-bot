const { PermissionFlagsBits, PermissionsBitField } = require("discord.js")
const startCase = require("lodash/startCase")
const { orange, red } = require("../static/colors")

const missingPermissionsToStr = (permissions, requiredFlags) => {
	const serializedPermissions = permissions.serialize()
	const requiredPermissionsArr = new PermissionsBitField(requiredFlags).toArray()

	let str = ''

	for (const perm of requiredPermissionsArr) {
		if (!serializedPermissions[perm])
			str += `❌ \`${startCase(perm)}\`\n`
	}

	return str
}

const checkPermissions = (i, channels, client) => {
	const { applicationsChannelID } = channels

	if (i.commandName === "apply") {
		const applicationsChannelPermissions = client.channels.cache.get(applicationsChannelID).permissionsFor(client.user)
		const requiredFlags = [
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.UseExternalEmojis
		]

		if (!applicationsChannelPermissions.has(requiredFlags)) {
			return {
				error: `**Missing permissions in** <#${applicationsChannelID}>.\n\n${missingPermissionsToStr(applicationsChannelPermissions, requiredFlags)}`,
			}
		}
	}
	else {
		const channelPermissions = client.channels.cache.get(i.channelId).permissionsFor(client.user)
		const requiredFlags = [PermissionFlagsBits.UseExternalEmojis]

		if (!channelPermissions.has(requiredFlags)) {
			return {
				error: `__**Missing permissions**__\n\n${missingPermissionsToStr(channelPermissions, requiredFlags)}`,
			}
		}
	}

	return {}
}

const validate = (i, channels, client) => {
	const { applyChannelID, applicationsChannelID, commandChannelID } = channels

	const response = {
		color: orange,
		onlyShowToUser: true
	}

	if (i.commandName === "apply") {
		if (applyChannelID !== i.channelId) {
			return {
				...response,
				error: `You can only use this command in the set **apply channel**! (<#${applyChannelID}>)`
			}
		}
		else if (!applyChannelID) {
			return {
				...response,
				error: "**No apply channel set.**"
			}
		}
		else if (!applicationsChannelID) {
			return {
				...response,
				error: "**No applications channel set.**"
			}
		}
	}
	else {
		if (commandChannelID && commandChannelID !== i.channel.id) {
			return {
				...response,
				error: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`
			}
		}
	}

	const { error } = checkPermissions(i, channels, client)

	if (error) {
		return {
			...response,
			color: red,
			error
		}
	}

	return {}
}

module.exports = {
	validate,
	missingPermissionsToStr
}