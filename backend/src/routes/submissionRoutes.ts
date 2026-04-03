import { Router } from 'express';
import { submitProblem, getUserSubmissions } from '../controllers/submissionController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, submitProblem);
router.get('/', authenticateToken, getUserSubmissions);

export default router;
