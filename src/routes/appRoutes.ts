import { Router } from 'express';
// Ensure the path string closes perfectly with a matching single quote (')
import { getDiscoverFeed, getEventsFeed } from '../controllers/appController.js';

const router = Router();

router.get('/discover', getDiscoverFeed);
router.get('/events', getEventsFeed);

export default router;