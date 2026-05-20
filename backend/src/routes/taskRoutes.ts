import express from 'express';
import { getDailyTask, completeTask, checkCompletion, getUserStreakInfo } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/today', authenticateToken, getDailyTask);
router.get('/check-completion', authenticateToken, checkCompletion);
router.get('/streak-info', authenticateToken, getUserStreakInfo);
router.post('/complete', authenticateToken, completeTask);

export default router;
