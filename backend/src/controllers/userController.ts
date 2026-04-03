import { Request, Response } from 'express';
import prisma from '../config/db';
import { syncUserData } from '../services/scraperService';

export const requestProfileChange = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { platform, newUrl } = req.body;

        if (!['leetcode', 'codechef', 'codeforces', 'gfg'].includes(platform)) {
            res.status(400).json({ error: 'Invalid platform' });
            return;
        }

        const urlFieldMap: Record<string, string> = {
            'leetcode': 'leetcodeUrl',
            'codechef': 'codechefUrl',
            'codeforces': 'codeforcesUrl',
            'gfg': 'gfgUrl'
        };

        const updateData: any = {};
        updateData[urlFieldMap[platform]] = newUrl;

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Automatically fetch data from the new URL
        try {
            await syncUserData(userId);
        } catch (syncErr) {
            console.error('Auto-sync after URL update failed:', syncErr);
            // We still want to return success for the URL update itself
        }

        res.status(200).json({ message: 'Profile URL updated and data synced successfully' });
    } catch (error) {
        console.error('Update URL Error:', error);
        res.status(500).json({ error: 'Internal server error while updating URL' });
    }
};

export const getMyRequests = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const requests = await prisma.profileChangeRequest.findMany({
            where: { userId },
            orderBy: { requestedAt: 'desc' }
        });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
