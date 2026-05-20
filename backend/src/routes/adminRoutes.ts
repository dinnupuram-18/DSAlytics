import { Router } from 'express';
import {
    addBatch,
    getExportData,
    getBatches,
    getProfileRequests,
    handleProfileRequest,
    getUsers,
    getUserDetails,
    updateUserPoints,
    deleteUser,
    getSystemAnalytics
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// All admin routes require: valid JWT token + must be the designated admin (24J41A05HK)
router.post('/batches', authenticateToken, requireAdmin, addBatch);
router.get('/batches', authenticateToken, requireAdmin, getBatches);
router.get('/export', authenticateToken, requireAdmin, getExportData);
router.get('/requests', authenticateToken, requireAdmin, getProfileRequests);
router.put('/handle-request', authenticateToken, requireAdmin, handleProfileRequest);

// User Moderation
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.get('/users/:id', authenticateToken, requireAdmin, getUserDetails);
router.patch('/users/:id/points', authenticateToken, requireAdmin, updateUserPoints);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

// Analytics
router.get('/analytics', authenticateToken, requireAdmin, getSystemAnalytics);

export default router;
