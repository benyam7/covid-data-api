import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../models/api-key';

export const apiKeyValidationMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            return res.status(401).json({ error: 'API key is required' });
        }

        // Validate API key in the database
        const validKey = await ApiKey.findOne({ key: apiKey });

        if (!validKey) {
            return res.status(403).json({ error: 'Invalid API key' });
        }

        // Check for expiration
        if (validKey.expiresAt < new Date()) {
            return res.status(403).json({ error: 'API key has expired' });
        }

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error('API Key validation error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
