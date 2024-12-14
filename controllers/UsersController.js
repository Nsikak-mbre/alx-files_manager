import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validate email and password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Ensure the database connection is available
    if (!dbClient.isAlive()) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    try {
      const userCollection = dbClient.database.collection('users');

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex');

      // Insert the new user into the database
      const result = await userCollection.insertOne({
        email,
        password: hashedPassword,
      });

      // Respond with the new user details
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
