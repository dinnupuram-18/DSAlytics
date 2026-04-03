import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/authRoutes';
import submissionRoutes from './routes/submissionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';
import syncRoutes from './routes/syncRoutes';
import taskRoutes from './routes/taskRoutes';
import competitionRoutes from './routes/competitionRoutes';
import notificationRoutes from './routes/notificationRoutes';
import friendRoutes from './routes/friendRoutes';
import challengeRoutes from './routes/challengeRoutes';
import { initCronJobs } from './services/cronService';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/challenge', challengeRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'DSAlytics API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    initCronJobs();
});

// Process-level error handling to catch hidden crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give some time for logging before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});





