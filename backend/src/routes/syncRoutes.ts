import { Router } from 'express';
import { syncMe } from '../controllers/syncController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Route for manual leetcode/platform sync
// POST /api/sync/fetch-leetcode
router.post('/fetch-leetcode', authenticateToken, syncMe);

export default router;
