const { orange, red } = require("../static/colors")

const permissionsToStrList = (requiredPerms, missingPerms) => {
	return requiredPerms.map((p) => (missingPerms.includes(p) ? `❌ \`${p}\`\n`.replace("_", " ") : `✅ \`${p}\`\n`.replace("_", " "))).join("")
}

const checkPermissions = (i, channels, client) => {
	const command = i.client.commands.get(i.commandName)
	const { applicationsChannelID } = channels
	if (i.commandName === "apply") {
		const applicationsChannelPermissions = client.channels.cache.get(applicationsChannelID).permissionsFor(client.user).toArray()
		const requiredPerms = [
			"VIEW_CHANNEL",
			"SEND_MESSAGES",
			"EMBED_LINKS",
			"USE_EXTERNAL_EMOJIS"
		]
		const missingPerms = requiredPerms.filter((p) => !applicationsChannelPermissions.includes(p))

		if (missingPerms.length > 0) {
			return {
				error: `**Missing permissions in** <#${applicationsChannelID}>.\n\n${permissionsToStrList(requiredPerms, missingPerms)}`,
			}
		}
	}
	else {
		if (!i.member.permissions.has(command.data.userPermissions || [])) {
			const permissionList = command.data.userPermissions
				.map((c) => (i.member.permissions.has(c) ? `✅ \`${c}\`\n`.replace("_", " ") : `❌ \`${c}\`\n`.replace("_", " ")))
				.join("")

			return {
				error: `You don't have **permission(s)** to use this command.\n\n${permissionList}`
			}
		}

		const channelPermissions = client.channels.cache.get(i.channelId).permissionsFor(client.user).toArray()
		const requiredPerms = ["USE_EXTERNAL_EMOJIS"]
		const missingPerms = requiredPerms.filter((p) => !channelPermissions.includes(p))

		if (missingPerms.length > 0) {
			return {
				error: `__**Missing permissions**__\n\n${permissionsToStrList(requiredPerms, missingPerms)}`,
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
		if (applyChannelID !== i.channel.id) {
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
	permissionsToStrList
}