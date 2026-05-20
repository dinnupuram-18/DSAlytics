import { Response } from 'express';
import { syncUserData } from '../services/scraperService';
import { clearCache, clearCacheByPrefix } from '../services/cacheService';

export const syncMe = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        console.log('=== SYNC STARTED for user:', userId, '===');
        
        const result = await syncUserData(userId);

        console.log('=== SYNC COMPLETED ===');
        console.log('Total Points:', result.totalPoints);
        console.log('Platform Stats:', JSON.stringify(result.platformStats, null, 2));

        // Invalidate stale caches so next visit gets fresh data
        clearCache(`profile:${userId}`);
        clearCacheByPrefix('leaderboard:');

        res.status(200).json({
            message: 'Data abstracted and points synced successfully!',
            totalPoints: result.totalPoints,
            platformStats: result.platformStats
        });
    } catch (error: any) {
        console.error('Sync Error:', error);
        console.error('Error Stack:', error.stack);
        res.status(500).json({ error: error.message || 'Internal server error during sync' });
    }
};
