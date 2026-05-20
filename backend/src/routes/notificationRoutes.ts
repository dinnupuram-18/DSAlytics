import { Router } from 'express';
import { getNotifications, getUnreadCount, markAllRead, markOneRead, broadcastNotification } from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.get('/count', authenticateToken, getUnreadCount);
router.post('/read', authenticateToken, markAllRead);
router.post('/read/:id', authenticateToken, markOneRead);
router.post('/broadcast', authenticateToken, broadcastNotification);

export default router;
