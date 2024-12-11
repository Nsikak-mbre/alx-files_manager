import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

// Define endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// add new user
router.post('/users', UsersController.postNew);

export default router;
