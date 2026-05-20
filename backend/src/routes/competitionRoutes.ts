import { Router } from 'express';
import {
    createCompetition,
    getCompetitions,
    updateCompetition,
    deleteCompetition
} from '../controllers/competitionController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getCompetitions);
router.post('/', authenticateToken, createCompetition);
router.patch('/:id', authenticateToken, updateCompetition);
router.delete('/:id', authenticateToken, deleteCompetition);

export default router;
