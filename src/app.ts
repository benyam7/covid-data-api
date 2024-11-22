import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import covidRoutes from './routes/covid-routes';
import { apiLimiter } from './middelware/rate-limitter';
import { corsHandler } from './middelware/cors-handler';
dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI || '', {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then((e) => console.log('Connected to MongoDB', e.version))
    .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

// TOD: add api-key, apiLimiter middelware
app.use(corsHandler);
app.use(
    '/api',
    // apiLimiter,
    covidRoutes
);

export default app;
