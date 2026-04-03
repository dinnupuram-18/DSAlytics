import { Request, Response } from 'express';
import prisma from '../config/db';

export const addBatch = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { year } = req.body;
        const newBatch = await prisma.batch.create({
            data: { year },
        });
        res.status(201).json({ message: 'Batch added successfully', batch: newBatch });
    } catch (error) {
        console.error('Add Batch Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getExportData = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const users = await prisma.user.findMany({
            select: {
                name: true,
                collegeId: true,
                batch: true,
                department: true,
                totalPoints: true,
                dailyStreak: true,
                submissions: {
                    select: {
                        platform: true,
                        topic: true,
                        difficulty: true,
                        dateSolved: true
                    }
                }
            },
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBatches = async (req: any, res: Response): Promise<void> => {
    try {
        const batches = await prisma.batch.findMany();
        res.status(200).json(batches);
    } catch (error) {
        console.error('Get Batches Error', error);
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

export const getProfileRequests = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const requests = await prisma.profileChangeRequest.findMany({
            include: { user: { select: { name: true, collegeId: true } } },
            orderBy: { requestedAt: 'desc' }
        });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const handleProfileRequest = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { requestId, status } = req.body; // status: 'APPROVED' or 'REJECTED'

        const request = await prisma.profileChangeRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        if (status === 'APPROVED') {
            const updateField = `${request.platform}Url`;
            await prisma.user.update({
                where: { id: request.userId },
                data: { [updateField]: request.newUrl }
            });
        }

        const updatedRequest = await prisma.profileChangeRequest.update({
            where: { id: requestId },
            data: { status }
        });

        res.status(200).json({ message: `Request ${status.toLowerCase()} successfully`, request: updatedRequest });
    } catch (error) {
        console.error('Handle Request Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsers = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { collegeId: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    collegeId: true,
                    batch: true,
                    department: true,
                    totalPoints: true,
                    isAdmin: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.user.count({ where }),
        ]);

        res.status(200).json({ users, total, pages: Math.ceil(total / Number(limit)) });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserDetails = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                submissions: { take: 10, orderBy: { dateSolved: 'desc' } },
                stats: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get User Details Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUserPoints = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { id } = req.params;
        const { points, reason } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { totalPoints: { increment: points } },
        });

        // Optional: Log point change or send notification
        await prisma.notification.create({
            data: {
                userId: id,
                message: `Admin adjusted your points by ${points}. Reason: ${reason || 'N/A'}`,
                type: 'system_alert',
            }
        });

        res.status(200).json({ message: 'Points updated successfully', user });
    } catch (error) {
        console.error('Update Points Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSystemAnalytics = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }

        // Submissions by platform
        const submissionsByPlatform = await prisma.submission.groupBy({
            by: ['platform'],
            _count: { _all: true }
        });

        // Recent 7 days activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyActivity = await prisma.submission.groupBy({
            by: ['dateSolved'],
            where: { dateSolved: { gte: sevenDaysAgo } },
            _count: { _all: true },
            orderBy: { dateSolved: 'asc' }
        });

        // User growth
        const usersByBatch = await prisma.user.groupBy({
            by: ['batch'],
            _count: { _all: true }
        });

        res.status(200).json({
            platformDistribution: submissionsByPlatform.map(p => ({ name: p.platform, value: p._count._all })),
            activity: dailyActivity.map(d => ({ date: d.dateSolved.toLocaleDateString(), count: d._count._all })),
            userClusters: usersByBatch.map(b => ({ name: b.batch, count: b._count._all }))
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
