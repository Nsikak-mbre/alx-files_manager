import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate input
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Check parent folder if parentId is provided
    if (parentId) {
      const parentFile = await dbClient.database.collection('files').findOne({ _id: dbClient.convertToObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    };

    if (type === 'folder') {
      const result = await dbClient.database.collection('files').insertOne(fileDocument);
      return res.status(201).json({ id: result.insertedId, ...fileDocument });
    }

    // Set up storage folder
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    try {
      await accessAsync(FOLDER_PATH).catch(() => mkdirAsync(FOLDER_PATH, { recursive: true }));
    } catch (error) {
      console.error('Error ensuring folder exists:', error);
      return res.status(500).json({ error: 'Could not ensure storage folder' });
    }

    // Save file content to local storage
    const fileUUID = uuidv4();
    const localPath = path.join(FOLDER_PATH, fileUUID);

    try {
      await writeFileAsync(localPath, Buffer.from(data, 'base64'));
    } catch (error) {
      console.error('Error saving file:', error);
      return res.status(500).json({ error: 'Could not save file' });
    }

    // Add file document to the database
    fileDocument.localPath = localPath;
    const result = await dbClient.database.collection('files').insertOne(fileDocument);

    return res.status(201).json({ id: result.insertedId, ...fileDocument });
  }
}

export default FilesController;
