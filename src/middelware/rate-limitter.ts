import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each API key to 100 requests per 15 minutes
    message: 'Too many requests, please try again later.',
});
