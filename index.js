const { AutoPoster } = require("topgg-autoposter")

require("dotenv").config()

const mongo = require("./src/util/mongo")
const { initializeCronJobs, initializeEvents, initializeClient } = require("./src/util/initialize")

mongo.init()

const client = initializeClient()
initializeCronJobs(mongo, client)
initializeEvents(mongo, client)

AutoPoster(process.env.TOPGG_TOKEN, client)

process.on("unhandledRejection", (err) => {
	console.log("---UNHANDLED REJECION---")
	console.error(err)
})

process.on("uncaughtException", (err) => {
	console.log("---UNCAUGHT EXCEPTION---")
	console.error(err)
})
