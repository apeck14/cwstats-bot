require("dotenv").config()

const mongo = require("./src/util/mongo")
const { initializeCronJobs, initializeEvents, initializeClient } = require("./src/util/initialize")

mongo.init()

initializeClient()
	.then((client) => initializeCronJobs(mongo, client))
	.then((client) => initializeEvents(mongo, client))

process.on("unhandledRejection", (err) => {
	console.log("---UNHANDLED REJECION---")
	console.log(err)
})

process.on("uncaughtException", (err) => {
	console.log("---UNCAUGHT EXCEPTION---")
	console.log(err)
})
