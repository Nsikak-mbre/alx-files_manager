import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;
    this._db = null;

    // Connect to MongoDB in the constructor
    this.client.connect().then(() => {
      this._db = this.client.db(this.dbName);
    }).catch((err) => {
      console.error('Failed to connect to MongoDB:', err);
    });
  }

  // Regular function to check if the connection is alive
  isAlive() {
    return this.client.topology.isConnected() && this._db !== null;
  }

  async nbUsers() {
    try {
      return await this._db.collection('users').countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  async nbFiles() {
    try {
      if (!this.isAlive()) return 0;
      return await this._db.collection('files').countDocuments();
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
