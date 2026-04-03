import { Request, Response } from 'express';
import prisma from '../config/db.js';

export const sendChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
        const senderId = (req as any).user.id;
        const { receiverIds, problemName, problemURL, difficulty } = req.body;

        if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
            res.status(400).json({ error: "No receivers specified." });
            return;
        }

        const sender = await prisma.user.findUnique({ where: { id: senderId } });
        if (!sender) {
            res.status(404).json({ error: "Sender not found" });
            return;
        }

        // Create a challenge for each receiver
        const challenges = [];
        const notifications = [];

        for (const receiverId of receiverIds) {
            const challenge = await prisma.challenge.create({
                data: {
                    senderId,
                    receiverId,
                    problemName,
                    problemURL,
                    difficulty,
                }
            });
            challenges.push(challenge);

            // Create notification for receiver
            notifications.push({
                userId: receiverId,
                message: `${sender.name} sent you a challenge: ${problemName}`,
                type: 'challenge_received',
                refId: challenge.id
            });
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });
        }

        res.status(201).json({ message: "Challenges sent successfully!", challenges });
    } catch (error) {
        console.error("Challenge Send Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getReceivedChallenges = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const challenges = await prisma.challenge.findMany({
            where: { receiverId: userId },
            include: {
                sender: { select: { name: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(challenges);
    } catch (error) {
        console.error("Get Received Challenges Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getSentChallenges = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const challenges = await prisma.challenge.findMany({
            where: { senderId: userId },
            include: {
                receiver: { select: { name: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(challenges);
    } catch (error) {
        console.error("Get Sent Challenges Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const completeChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const id = req.params.id as string;

        const challenge = await prisma.challenge.findUnique({ where: { id } });

        if (!challenge) {
            res.status(404).json({ error: "Challenge not found" });
            return;
        }

        if (challenge.receiverId !== userId) {
            res.status(403).json({ error: "You are not authorized to complete this challenge" });
            return;
        }

        const updated = await prisma.challenge.update({
            where: { id },
            data: { status: "COMPLETED" }
        });

        // Add 10 points to receiver and optionally notify sender
        await prisma.user.update({
            where: { id: userId },
            data: { totalPoints: { increment: 10 } }
        });

        const receiver = await prisma.user.findUnique({ where: { id: userId } });
        
        // Notify sender that the challenge was completed
        await prisma.notification.create({
            data: {
                userId: challenge.senderId,
                message: `${receiver?.name || 'A friend'} completed your challenge: ${challenge.problemName}!`,
                type: 'challenge_accepted', // using existing enum
                refId: challenge.id
            }
        });

        res.status(200).json({ message: "Challenge completed successfully!", challenge: updated });
    } catch (error) {
        console.error("Complete Challenge Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
