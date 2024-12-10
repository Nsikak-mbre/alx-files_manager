const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.database = null;

    try {
      this.client.connect((err) => {
        if (err) {
          console.error('Error connecting to MongoDB:', err);
          this.client = null;
        } else {
          this.database = this.client.db(database);
        }
      });
    } catch (error) {
      console.error('Connection error:', error);
      this.client = null;
    }
  }

  isAlive() {
    return this.client.topology.isConnected() && this._db !== null;
  }

  async nbUsers() {
    if (!this.database) return 0;

    try {
      return await this.database.collection('users').count();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.database) return 0;

    try {
      return await this.database.collection('files').count();
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
