import { Request, Response } from 'express';
import { checkTaskEligibility, generateDailyTask, completeDailyTask, checkAutoCompletion } from '../services/taskService';
import prisma from '../config/db.js';

export const getDailyTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const eligibility = await checkTaskEligibility(userId);
        if (!eligibility.eligible) {
            return res.json({ task: null, reason: eligibility.reason });
        }

        // Check if there is already an active uncompleted task today for the user
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let activeTask = await prisma.dailyTask.findFirst({
            where: {
                userId,
                taskDate: { gte: today }
            }
        });

        // Auto trigger task generation if none exists for today
        if (!activeTask) {
            const generated = await generateDailyTask(userId);
            activeTask = generated ? await prisma.dailyTask.findFirst({
                where: { userId, taskDate: { gte: today } }
            }) : null;
        }

        if (!activeTask) {
            return res.json({ task: null, reason: "No more valid questions found for your solved topics today." });
        }

        // Enrich with estimatedMinutes based on difficulty
        const difficultyMinutes: Record<string, number> = { Easy: 15, Medium: 30, Hard: 60 };
        const enriched = {
            ...activeTask,
            estimatedMinutes: difficultyMinutes[activeTask.difficulty] ?? 30
        };

        res.json({ task: enriched });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

/**
 * Auto-completion check: compares user's recent LeetCode submissions to today's task.
 * Called by frontend polling (every 60s). No manual action needed from user.
 */
export const checkCompletion = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const result = await checkAutoCompletion(userId);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
};

export const completeTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { taskId } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!taskId) return res.status(400).json({ error: "Task ID required" });

        const result = await completeDailyTask(taskId, userId);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};
