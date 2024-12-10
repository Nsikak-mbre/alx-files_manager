import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Explicitly connect the client
    this.client.connect();
  }

  isAlive() {
    return this.client.isOpen;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return JSON.parse(value);
    } catch (error) {
      console.error('Error getting value from Redis:', error);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.setEx(key, duration, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting value in Redis:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Error deleting key from Redis:', error);
      return false;
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
