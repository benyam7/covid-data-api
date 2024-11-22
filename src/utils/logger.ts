import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, errors, colorize, json } = format;
// log format
const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        customFormat
    ),
    transports: [
        // Log to console with colorization
        new transports.Console({
            format: combine(colorize(), customFormat),
        }),
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new transports.Console({
            format: combine(colorize(), customFormat),
        }),
    ],
});

export default logger;
