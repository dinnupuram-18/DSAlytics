import { Response } from 'express';
import prisma from '../config/db.js';

const DIFFICULTY_POINTS: Record<string, number> = {
    Easy: 5,
    Medium: 10,
    Hard: 20,
};

export const submitProblem = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { platform, problemName, difficulty, topic } = req.body;

        const pointsAwarded = DIFFICULTY_POINTS[difficulty] || 0;

        // Start a transaction: Create submission, Update user points & streak
        const [submission, user] = await prisma.$transaction([
            prisma.submission.create({
                data: {
                    userId,
                    platform,
                    problemName,
                    difficulty,
                    topic,
                    pointsAwarded,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    totalPoints: { increment: pointsAwarded },
                    // A real app would calculate streak based on LastSolvedDate vs Today
                    dailyStreak: { increment: 1 },
                },
            }),
        ]);

        res.status(201).json({ message: 'Problem submitted successfully!', pointsAwarded, newTotal: user.totalPoints });
    } catch (error) {
        console.error('Submission Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserSubmissions = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const submissions = await prisma.submission.findMany({
            where: { userId },
            orderBy: { dateSolved: 'desc' },
        });

        res.status(200).json(submissions);
    } catch (error) {
        console.error('Get Submissions Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
