require("dotenv").config()

const { AutoPoster } = require("topgg-autoposter")
const { initializeClient, initializeEvents } = require("./src/util/initialize")
const { TOPGG_TOKEN } = require("./config")

initializeClient()
  .then((client) => initializeEvents(client))
  .then((client) => AutoPoster(TOPGG_TOKEN, client))
  .catch(() => {})

process.on("unhandledRejection", (reason, promise) => {
  console.log("---UNHANDLED REJECTION---")
  console.log("Reason:", reason)
  console.log("Promise:", promise)
  console.trace()
})

process.on("uncaughtException", (err) => {
  console.log("---UNCAUGHT EXCEPTION---")
  console.error(err)
})
