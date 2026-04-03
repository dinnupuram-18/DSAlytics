import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import fs from 'fs';
import path from 'path';
import { getCache, setCache, clearCache } from '../services/cacheService';
import { syncUserData } from '../services/scraperService';

const PROFILE_TTL = 60; // Cache profile for 60 seconds

const isValidUrl = (url: string): boolean => {
    try { new URL(url); return true; } catch { return false; }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name,
            email,
            collegeId,
            batch,
            department,
            password,
            leetcodeUrl,
            codechefUrl,
            codeforcesUrl,
            gfgUrl
        } = req.body;

        if (!collegeId || !password || !email) {
            res.status(400).json({ error: 'College ID, Email, and password are required' });
            return;
        }

        const normalizedCollegeId = collegeId.trim().toUpperCase();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { collegeId: normalizedCollegeId },
                    { email: normalizedEmail }
                ]
            }
        });

        if (existingUser) {
            res.status(400).json({ error: 'User with this College ID or Email already exists' });
            return;
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                collegeId: normalizedCollegeId,
                batch,
                department,
                passwordHash,
                // @ts-ignore
                leetcodeUrl: leetcodeUrl || null,
                // @ts-ignore
                codechefUrl: codechefUrl || null,
                // @ts-ignore
                codeforcesUrl: codeforcesUrl || null,
                // @ts-ignore
                gfgUrl: gfgUrl || null,
            },
        });

        res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: error instanceof Error ? `Internal server error: ${error.message}` : 'Internal server error' });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { collegeId, password } = req.body;

        if (!collegeId || typeof collegeId !== 'string') {
            res.status(400).json({ error: 'Valid College ID is required' });
            return;
        }

        const normalizedCollegeId = collegeId.trim().toUpperCase();

        const user = await prisma.user.findUnique({
            where: { collegeId: normalizedCollegeId },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const secret = process.env.JWT_SECRET || 'secret';
        const token = jwt.sign(
            { id: user.id, collegeId: user.collegeId, isAdmin: user.isAdmin },
            secret,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                collegeId: user.collegeId,
                isAdmin: user.isAdmin,
            },
        });

        // Trigger asynchronous background sync
        syncUserData(user.id).catch(err => {
            console.error(`Background sync failed for user ${user.id}:`, err);
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: error instanceof Error ? `Internal server error: ${error.message}` : 'Internal server error' });
    }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const cacheKey = `profile:${userId}`;

        // Return cached profile if available (avoids DB hit)
        const cached = getCache<any>(cacheKey);
        if (cached) {
            res.status(200).json(cached);
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                collegeId: true,
                batch: true,
                department: true,
                // @ts-ignore
                dob: true,
                // @ts-ignore
                aboutMe: true,
                // @ts-ignore
                branch: true,
                // @ts-ignore
                year: true,
                // @ts-ignore
                section: true,
                // @ts-ignore
                placementTarget: true,
                // @ts-ignore
                leetcodeUrl: true,
                // @ts-ignore
                codechefUrl: true,
                // @ts-ignore
                codeforcesUrl: true,
                // @ts-ignore
                gfgUrl: true,
                // @ts-ignore
                hackerrankUrl: true,
                // @ts-ignore
                leetcodePoints: true,
                // @ts-ignore
                codechefPoints: true,
                // @ts-ignore
                codeforcesPoints: true,
                // @ts-ignore
                gfgPoints: true,
                // @ts-ignore
                githubPoints: true,
                totalPoints: true,
                dailyStreak: true,
                // @ts-ignore
                topicStats: true,
                // @ts-ignore
                avatarUrl: true,
                stats: true,
                isAdmin: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Cache for PROFILE_TTL seconds
        setCache(cacheKey, user, PROFILE_TTL);
        res.status(200).json(user);
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const uploadAvatar = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            res.status(400).json({ error: 'No image uploaded' });
            return;
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        // @ts-ignore
        if (user && user.avatarUrl) {
            // @ts-ignore
            const oldPath = path.join(__dirname, '../../', user.avatarUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await prisma.user.update({
            where: { id: userId },
            // @ts-ignore
            data: { avatarUrl },
        });

        // Invalidate profile cache so next fetch returns new avatar
        clearCache(`profile:${userId}`);

        res.status(200).json({ message: 'Avatar uploaded successfully', avatarUrl });
    } catch (error) {
        console.error('Avatar Upload Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteAvatar = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        // @ts-ignore
        if (user && user.avatarUrl) {
            // @ts-ignore
            const oldPath = path.join(__dirname, '../../', user.avatarUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await prisma.user.update({
            where: { id: userId },
            // @ts-ignore
            data: { avatarUrl: null },
        });

        clearCache(`profile:${userId}`);
        res.status(200).json({ message: 'Avatar removed successfully' });
    } catch (error) {
        console.error('Avatar Delete Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const updateProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const {
            name, dob, aboutMe, branch, year, section, placementTarget,
            leetcodeUrl, codechefUrl, codeforcesUrl, gfgUrl, hackerrankUrl
        } = req.body;

        // Input validation
        if (name && typeof name === 'string' && name.trim().length < 2) {
            res.status(400).json({ error: 'Name must be at least 2 characters.' });
            return;
        }
        if (section && section.trim().length > 5) {
            res.status(400).json({ error: 'Section must be 1-5 characters (e.g. A, B1).' });
            return;
        }
        const platformUrls: Record<string, string> = { leetcodeUrl, codechefUrl, codeforcesUrl, gfgUrl, hackerrankUrl };
        for (const [key, val] of Object.entries(platformUrls)) {
            if (val && val.trim() !== '' && !isValidUrl(val.trim())) {
                res.status(400).json({ error: `Invalid URL for ${key.replace('Url', '')}. Please enter a valid URL.` });
                return;
            }
        }

        const dateObj = dob ? new Date(dob) : null;

        await prisma.user.update({
            where: { id: userId },
            data: {
                name: name?.trim(),
                // @ts-ignore
                dob: dateObj,
                // @ts-ignore
                aboutMe: aboutMe?.trim(),
                // @ts-ignore
                branch: branch?.trim(),
                // @ts-ignore
                year: year?.trim(),
                // @ts-ignore
                section: section?.trim(),
                // @ts-ignore
                placementTarget: placementTarget?.trim(),
                // @ts-ignore
                leetcodeUrl: leetcodeUrl?.trim() || null,
                // @ts-ignore
                codechefUrl: codechefUrl?.trim() || null,
                // @ts-ignore
                codeforcesUrl: codeforcesUrl?.trim() || null,
                // @ts-ignore
                gfgUrl: gfgUrl?.trim() || null,
                // @ts-ignore
                hackerrankUrl: hackerrankUrl?.trim() || null
            }
        });

        // Invalidate cached profile so next fetch gets fresh data
        clearCache(`profile:${userId}`);

        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ error: 'Internal server error while updating profile' });
    }
};
