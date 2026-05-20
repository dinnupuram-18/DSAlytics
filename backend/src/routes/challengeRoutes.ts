import express from 'express';
import { sendChallenge, getReceivedChallenges, getSentChallenges, completeChallenge } from '../controllers/challengeController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/send', authenticateToken, sendChallenge);
router.get('/received', authenticateToken, getReceivedChallenges);
router.get('/sent', authenticateToken, getSentChallenges);
router.put('/:id/complete', authenticateToken, completeChallenge);

export default router;
