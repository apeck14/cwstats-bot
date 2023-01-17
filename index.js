require("dotenv").config()

const { AutoPoster } = require("topgg-autoposter")
const mongo = require("./src/util/mongo")
const { initializeCronJobs, initializeEvents, initializeClient } = require("./src/util/initialize")

mongo.init()

const client = initializeClient()
initializeCronJobs(mongo, client)
initializeEvents(mongo, client)

try {
	AutoPoster(process.env.TOPGG_TOKEN, client)
}
catch (err) {
	console.log("TOPGG ERROR")
	console.log(err)
}

process.on("unhandledRejection", (err) => {
	console.log("---UNHANDLED REJECION---")
	console.error(err)
})

process.on("uncaughtException", (err) => {
	console.log("---UNCAUGHT EXCEPTION---")
	console.error(err)
})