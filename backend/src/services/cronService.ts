import cron from 'node-cron';
import prisma from '../config/db';
import { syncUserData } from './scraperService';
import { generateDailyTask } from './taskService';

/**
 * Daily Cron Job
 * Runs every day at midnight (00:00) to sync all user stats.
 */
export const initCronJobs = () => {
    // Cron schedule: every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        console.log('Running 2-hourly sync for all users...');
        try {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { leetcodeUrl: { not: null } },
                        { codechefUrl: { not: null } },
                        { codeforcesUrl: { not: null } },
                        { gfgUrl: { not: null } }
                    ]
                }
            });

            for (const user of users) {
                try {
                    console.log(`Syncing data for user: ${user.name} (${user.collegeId})`);
                    await syncUserData(user.id);
                } catch (err) {
                    console.error(`Failed to sync user ${user.id}:`, err);
                }
            }
            console.log('2-hourly sync completed.');
        } catch (error) {
            console.error('Cron Job error:', error);
        }
    });

    // Neon DB Keep-Alive Ping
    // Neon serverless databases go to sleep after ~5 minutes of inactivity. 
    // Pinging every 4 minutes keeps it active and prevents the 3-second cold start delay.
    cron.schedule('*/4 * * * *', async () => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            // Silently succeeds to avoid cluttering logs too much
        } catch (error) {
            console.error('Neon DB Keep-Alive ping failed:', error);
        }
    });

    // Smart Daily Tasks Generator
    // Runs every day at 12:00 AM
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily task generation...');
        try {
            const users = await prisma.user.findMany();
            for (const user of users) {
                // Determine eligibility to potentially save API calls
                try {
                    await generateDailyTask(user.id);
                } catch (err) {
                    console.error(`Failed to generate task for user ${user.id}:`, err);
                }
            }
            console.log('Daily tasks generated successfully.');
        } catch (error) {
            console.error('Task Job error:', error);
        }
    });
};
