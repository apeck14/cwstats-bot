const { MongoClient } = require('mongodb');

class MongoBot {
    constructor() {
        this.client = new MongoClient(process.env.URI, { useUnifiedTopology: true, useNewUrlParser: true });
    }
    async init() {
        await this.client.connect();
        console.log('Database connected!');

        this.db = this.client.db('General');
    }

    isConnected() {
        return this.client.isConnected();
    }
}

module.exports = new MongoBot();