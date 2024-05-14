const { MongoClient } = require("mongodb")
const { URI } = require("../../config")

class MongoBot {
  constructor() {
    this.client = new MongoClient(URI)
  }

  async init() {
    await this.client.connect()
    console.log("Database connected!")

    this.db = this.client.db("General")
  }

  isConnected() {
    return this.client.isConnected()
  }
}

module.exports = new MongoBot()
