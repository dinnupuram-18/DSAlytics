import { Request, Response } from 'express';
import prisma from '../config/db.js';

// GET /api/friends/status/:targetId
// Returns: { status: 'none' | 'pending' | 'accepted', isSender?: boolean, requestId?: string }
export const getFriendStatus = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const targetId = req.params.targetId as string;

        const request = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: targetId },
                    { senderId: targetId, receiverId: currentUserId },
                ],
            },
        });

        if (!request) return res.json({ status: 'none' });

        if (request.status === 'accepted') {
            return res.json({ status: 'accepted', requestId: request.id });
        }

        if (request.status === 'pending') {
            return res.json({
                status: 'pending',
                isSender: request.senderId === currentUserId,
                requestId: request.id,
            });
        }

        return res.json({ status: 'none' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/friends/request  body: { receiverId }
export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.id;
        const { receiverId } = req.body;

        if (!receiverId) return res.status(400).json({ error: 'receiverId required' });
        if (senderId === receiverId) return res.status(400).json({ error: 'Cannot friend yourself' });

        // Check if a request already exists in either direction
        const existing = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });

        if (existing) return res.status(400).json({ error: 'Request already exists' });

        const friendRequest = await prisma.friendRequest.create({
            data: { senderId, receiverId, status: 'pending' },
        });

        // Create a notification for the receiver
        const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'friend_request',
                message: `${sender?.name} sent you a friend request`,
                refId: friendRequest.id,
            },
        });

        res.status(201).json(friendRequest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/friends/respond  body: { requestId, action: 'accepted' | 'rejected' }
export const respondToRequest = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const { requestId, action } = req.body;

        if (!requestId || !action) return res.status(400).json({ error: 'requestId and action required' });

        const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.receiverId !== currentUserId) return res.status(403).json({ error: 'Not authorized' });

        const updated = await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: action },
        });

        // Notify the sender if accepted
        if (action === 'accepted') {
            const receiver = await prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } });
            await prisma.notification.create({
                data: {
                    userId: request.senderId,
                    type: 'friend_accepted',
                    message: `${receiver?.name} accepted your friend request`,
                    refId: requestId,
                },
            });
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/friends/cancel/:requestId  (sender cancels a pending request)
export const cancelFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const requestId = req.params.requestId as string;

        const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.senderId !== currentUserId) return res.status(403).json({ error: 'Not authorized' });

        await prisma.friendRequest.delete({ where: { id: requestId } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/friends/unfriend/:requestId  (either party removes a friendship)
export const unfriend = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const requestId = req.params.requestId as string;

        const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.senderId !== currentUserId && request.receiverId !== currentUserId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.friendRequest.delete({ where: { id: requestId } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/friends/list  — returns list of accepted friends with leaderboard-style data
export const getFriendList = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;

        const accepted = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, status: 'accepted' },
                    { receiverId: currentUserId, status: 'accepted' },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true, name: true, collegeId: true, batch: true, avatarUrl: true,
                        totalPoints: true, leetcodePoints: true, codechefPoints: true,
                        codeforcesPoints: true, gfgPoints: true,
                        stats: { select: { totalSolved: true } },
                    },
                },
                receiver: {
                    select: {
                        id: true, name: true, collegeId: true, batch: true, avatarUrl: true,
                        totalPoints: true, leetcodePoints: true, codechefPoints: true,
                        codeforcesPoints: true, gfgPoints: true,
                        stats: { select: { totalSolved: true } },
                    },
                },
            },
        });

        // Return the friend (not the current user) from each relation
        const friends = accepted.map((r: typeof accepted[0]) => {
            const friend = r.senderId === currentUserId ? r.receiver : r.sender;
            return {
                ...friend,
                totalSolved: friend.stats?.totalSolved ?? 0,
            };
        });

        res.json(friends);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
