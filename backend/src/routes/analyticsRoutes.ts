import { Router } from 'express';
import { getPlacementReadiness } from '../controllers/analyticsController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/placement-readiness', authenticateToken, getPlacementReadiness);

export default router;
