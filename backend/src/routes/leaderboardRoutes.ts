import { Router } from 'express';
import { getOverallLeaderboard, getBatchLeaderboard } from '../controllers/leaderboardController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/overall', authenticateToken, getOverallLeaderboard);
router.get('/batch/:batchId', authenticateToken, getBatchLeaderboard);

export default router;
