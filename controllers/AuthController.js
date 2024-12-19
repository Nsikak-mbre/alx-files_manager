import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Decode the base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');

    if (!dbClient.database) {
      return res.status(500).send({ error: 'Internal Server Error' });
    }

    try {
      // Directly query MongoDB for the user
      const user = await dbClient.database.collection('users').findOne({ email });
      if (!user || user.password !== sha1(password)) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      // Generate a token
      const token = uuidv4();
      const key = `auth_${token}`;

      // Store the token in Redis for 24 hours
      await redisClient.set(key, user._id.toString(), 86400);

      // Return the token
      return res.status(200).send({ token });
    } catch (error) {
      console.error('Error during user authentication:', error);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Delete the token in Redis
    await redisClient.del(key);
    return res.status(204).send();
  }
}

export default AuthController;
