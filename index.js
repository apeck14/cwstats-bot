require("dotenv").config()

const { AutoPoster } = require("topgg-autoposter")
const { initializeClient, initializeEvents } = require("./src/util/initialize")
const { NODE_ENV, TOPGG_TOKEN } = require("./config")

const isDev = NODE_ENV === "dev"

let client // store reference for cleanup

initializeClient()
  .then((c) => {
    client = c
    return initializeEvents(client)
  })
  .then((c) => !isDev && AutoPoster(TOPGG_TOKEN, c))
  .catch((err) => {
    console.error("Initialization error:", err)
  })

// Graceful shutdown for PM2 restarts / kills
const shutdown = async () => {
  console.log("Shutting down gracefully...")
  if (client) {
    try {
      await client.destroy()
      console.log("Discord client destroyed.")
    } catch (err) {
      console.error("Error destroying Discord client:", err)
    }
  }
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

process.on("unhandledRejection", (reason) => {
  console.log("---UNHANDLED REJECTION---")
  console.log("Reason:", reason)
})

process.on("uncaughtException", (err) => {
  console.log("---UNCAUGHT EXCEPTION---")
  console.error(err)
})
