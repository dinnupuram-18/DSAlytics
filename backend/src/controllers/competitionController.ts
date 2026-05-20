import { Request, Response } from 'express';
import prisma from '../config/db';

export const createCompetition = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { title, startDate, endDate } = req.body;
        const competition = await prisma.competition.create({
            data: {
                title,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: true
            }
        });
        res.status(201).json(competition);
    } catch (error) {
        console.error('Create Competition Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCompetitions = async (req: Request, res: Response): Promise<void> => {
    try {
        const competitions = await prisma.competition.findMany({
            orderBy: { startDate: 'desc' }
        });
        res.status(200).json(competitions);
    } catch (error) {
        console.error('Get Competitions Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCompetition = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { id } = req.params;
        const { title, startDate, endDate, isActive } = req.body;
        const competition = await prisma.competition.update({
            where: { id },
            data: {
                title,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                isActive
            }
        });
        res.status(200).json(competition);
    } catch (error) {
        console.error('Update Competition Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCompetition = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { id } = req.params;
        await prisma.competition.delete({ where: { id } });
        res.status(200).json({ message: 'Competition deleted successfully' });
    } catch (error) {
        console.error('Delete Competition Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
