import express from 'express';
import { getDailyTask, completeTask, checkCompletion } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/today', authenticateToken, getDailyTask);
router.get('/check-completion', authenticateToken, checkCompletion);
router.post('/complete', authenticateToken, completeTask);

export default router;
