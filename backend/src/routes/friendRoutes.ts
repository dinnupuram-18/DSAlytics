import { Router } from 'express';
import {
    getFriendStatus,
    sendFriendRequest,
    respondToRequest,
    cancelFriendRequest,
    unfriend,
    getFriendList,
} from '../controllers/friendController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/status/:targetId', authenticateToken, getFriendStatus);
router.post('/request', authenticateToken, sendFriendRequest);
router.post('/respond', authenticateToken, respondToRequest);
router.delete('/cancel/:requestId', authenticateToken, cancelFriendRequest);
router.delete('/unfriend/:requestId', authenticateToken, unfriend);
router.get('/list', authenticateToken, getFriendList);

export default router;
