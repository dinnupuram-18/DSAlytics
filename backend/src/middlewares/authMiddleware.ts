import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_COLLEGE_ID = '24J41A05HK';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

/**
 * Middleware that restricts access to the admin user only (collegeId: 24J41A05HK).
 * Must be used AFTER authenticateToken.
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user || user.collegeId !== ADMIN_COLLEGE_ID) {
        res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
        return;
    }
    next();
};

