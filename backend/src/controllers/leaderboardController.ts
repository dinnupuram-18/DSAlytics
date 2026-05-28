import { Request, Response } from 'express';
import prisma from '../config/db';
import { getCache, setCache, clearCacheByPrefix } from '../services/cacheService';
import { syncUserData } from '../services/scraperService';

const LEADERBOARD_TTL = 120; // Cache leaderboard for 2 minutes

export const getOverallLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { branch, year, timeframe } = req.query;

        // Trigger automatic silent background sync for the requesting user (throttled to once every 2 minutes)
        const userId = (req as any).user?.id;
        if (userId) {
            const syncCacheKey = `auto_sync_throttle:${userId}`;
            const alreadySyncedRecently = getCache<boolean>(syncCacheKey);
            if (!alreadySyncedRecently) {
                setCache(syncCacheKey, true, 120);
                syncUserData(userId).catch(err => {
                    console.error(`Automatic background sync failed for user ${userId} on leaderboard fetch:`, err);
                });
            }
        }

        const cacheKey = `leaderboard:overall:${branch || 'all'}:${year || 'all'}:${timeframe || 'all'}`;
        const cached = getCache<any[]>(cacheKey);
        if (cached) {
            res.status(200).json(cached);
            return;
        }

        const whereClause: any = {};
        if (branch) whereClause.branch = { contains: branch as string, mode: 'insensitive' };
        if (year) whereClause.year = year as string;

        // Fetch users
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                collegeId: true,
                batch: true,
                department: true,
                branch: true,
                year: true,
                totalPoints: true,
                leetcodePoints: true,
                codechefPoints: true,
                codeforcesPoints: true,
                gfgPoints: true,
                hackerrankPoints: true,
                leetcodeUrl: true,
                codechefUrl: true,
                codeforcesUrl: true,
                gfgUrl: true,
                hackerrankUrl: true,
                dailyStreak: true,
                avatarUrl: true,
                stats: { select: { totalSolved: true } }
            },
        });

        let leaderboard = users.map((u: any) => ({
            ...u,
            totalSolved: u.stats?.totalSolved || 0,
            displayPoints: u.totalPoints
        }));

        // Handle Timeframe (Weekly/Monthly) filtering logic
        if (timeframe === 'weekly' || timeframe === 'monthly') {
            const typeValue = timeframe === 'weekly' ? 'WEEKLY' : 'MONTHLY';
            const snapshots = await prisma.pointSnapshot.findMany({
                where: { type: typeValue, userId: { in: users.map((u: any) => u.id) } }
            });

            // Map userId to their past totalPoints
            const snapshotMap = new Map(snapshots.map((s: any) => [s.userId, s.totalPoints]));

            leaderboard = leaderboard.map((u: any) => {
                const pastPoints = Number(snapshotMap.get(u.id) ?? 0);
                // Display points gained during this timeframe (current - past)
                const gained = Math.max(0, Number(u.totalPoints ?? 0) - pastPoints);
                return { ...u, displayPoints: gained };
            });
        }

        // Sort dynamically by the calculated displayPoints
        leaderboard.sort((a: any, b: any) => (b.displayPoints ?? 0) - (a.displayPoints ?? 0));

        const result = leaderboard.slice(0, 100);
        setCache(cacheKey, result, LEADERBOARD_TTL);
        res.status(200).json(result);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Internal server error while fetching leaderboard' });
    }
};

export const getBatchLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { batchId } = req.params;

        const leaderboard = await prisma.user.findMany({
            where: { batch: batchId as string },
            orderBy: { leetcodePoints: 'desc' },
            take: 100,
            select: {
                id: true,
                name: true,
                collegeId: true,
                department: true,
                totalPoints: true,
                leetcodePoints: true,
                codechefPoints: true,
                codeforcesPoints: true,
                gfgPoints: true,
                hackerrankPoints: true,
                dailyStreak: true,
                avatarUrl: true,
            },
        });

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error('Batch Leaderboard Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
