import { Request, Response } from 'express';
import prisma from '../config/db.js';

// GET /api/notifications
export const getNotifications = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const broadcastNotification = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({ error: 'Require Admin privilege' });
            return;
        }
        const { message, type = 'system_alert' } = req.body;

        const users = await prisma.user.findMany({ select: { id: true } });

        await prisma.notification.createMany({
            data: users.map(u => ({
                userId: u.id,
                message,
                type,
                isRead: false
            }))
        });

        res.status(201).json({ message: 'Broadcast sent successfully', count: users.length });
    } catch (error) {
        console.error('Broadcast Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/notifications/count
export const getUnreadCount = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const count = await prisma.notification.count({
            where: { userId, isRead: false }
        });
        res.status(200).json({ count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/notifications/read
export const markAllRead = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: 'All marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/notifications/read/:id
export const markOneRead = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });
        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark One Read Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
