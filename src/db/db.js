require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set. Please create a .env file with your MongoDB connection string.');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Export the client for use in routes
module.exports = { client };