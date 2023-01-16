const SUPPORT_SERVER_ID = "947608454456016896"

const logToSupportServer = (client, embed) => {
	try {
		client.channels.cache.get(SUPPORT_SERVER_ID).send({
			embeds: [embed],
		})
	}
	catch (e) {
		console.log("Error sending embed to Support Server")
		console.log(e)
	}
}

module.exports = {
	logToSupportServer
}