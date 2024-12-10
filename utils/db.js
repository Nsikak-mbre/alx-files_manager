const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Explicitly connect the client
    this.client.on('connect', () => {
      console.log('Connected to Redis server.');
    });
  }

  isAlive() {
    return this.client.connected;
  }

  // Manually promisify get method with proper error handling
  get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          console.error('Error getting value from Redis:', err);
          reject(new Error('Error getting value from Redis'));
        } else {
          resolve(JSON.parse(value));
        }
      });
    });
  }

  // Manually promisify setex method with proper error handling
  set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, JSON.stringify(value), (err) => {
        if (err) {
          console.error('Error setting value in Redis:', err);
          reject(new Error('Error setting value in Redis'));
        } else {
          resolve(true);
        }
      });
    });
  }

  // Manually promisify del method with proper error handling
  del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          console.error('Error deleting key from Redis:', err);
          reject(new Error('Error deleting key from Redis'));
        } else {
          resolve(true);
        }
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
