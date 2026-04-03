import { Response } from 'express';
import prisma from '../config/db.js';
import { analyzeUserReadiness } from '../services/analyticsService';

const CORE_TOPICS = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'DP', 'Greedy', 'Backtracking', 'Sorting', 'Searching'];

export const getPlacementReadiness = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { submissions: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Aggregate local submissions
        const localTopicCounts: Record<string, number> = {};
        user.submissions.forEach((sub: any) => {
            localTopicCounts[sub.topic] = (localTopicCounts[sub.topic] || 0) + 1;
        });

        // Combine with Scraped Stats
        const scrapedStats = (user.topicStats as Record<string, number>) || {};
        const combinedStats: Record<string, number> = { ...scrapedStats };

        // Add local counts to scraped counts
        Object.entries(localTopicCounts).forEach(([topic, count]) => {
            combinedStats[topic] = (combinedStats[topic] || 0) + count;
        });

        // Run Analysis against Interview Standards
        const analysis = analyzeUserReadiness(combinedStats);

        res.status(200).json({
            readinessScore: analysis.masteryScore,
            topicAnalysis: combinedStats,
            detailedReport: analysis.topicBreakdown,
            recommendation: analysis.recommendation,
            criticalWeaknesses: analysis.criticalWeaknesses
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
