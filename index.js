require("dotenv").config()

const { AutoPoster } = require("topgg-autoposter")
const mongo = require("./src/util/mongo")
const { initializeClient, initializeCronJobs, initializeEvents } = require("./src/util/initialize")

mongo.init()

initializeClient()
  .then((client) => initializeCronJobs(mongo, client))
  .then((client) => initializeEvents(mongo, client))
  .then((client) => AutoPoster(process.env.TOPGG_TOKEN, client))
  .catch((e) => console.log(e))

process.on("unhandledRejection", (err) => {
  console.log("---UNHANDLED REJECION---")
  console.error(err)
})

process.on("uncaughtException", (err) => {
  console.log("---UNCAUGHT EXCEPTION---")
  console.error(err)
})
