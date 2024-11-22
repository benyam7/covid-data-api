import { Request, Response } from 'express';
import { z } from 'zod';
import { CovidData, ICovidData } from '../models/covid-data';
import redisClient from '../utils/redis-client';
import { PipelineStage } from 'mongoose';
import logger from '../utils/logger';

const querySchema = z
    .object({
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid startDate',
        }),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid endDate',
        }),
        country: z.array(z.string()),
        query_type: z.string(),
        page: z
            .string()
            .optional()
            .transform((val) => parseInt(val || '1')),
        limit: z
            .string()
            .optional()
            .transform((val) => parseInt(val || '10')),
    })
    .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
        message: 'startDate must be before or equal to endDate',
        path: ['startDate', 'endDate'],
    });

// Utility function for caching with data compression
async function getCachedData<T>(
    cacheKey: string,
    readMongo: () => Promise<T>
): Promise<T> {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        logger.info(`Data retrieved from cache for key: ${cacheKey}`);
        return JSON.parse(cachedData.toString());
    }
    const data = await readMongo();
    await redisClient.setEx(cacheKey, 3600 * 24 * 7, JSON.stringify(data));
    return data;
}

export const getComparisonData = async (req: Request, res: Response) => {
    try {
        // Validate query parameters
        const params = querySchema.parse({
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            country: Array.isArray(req.query.country)
                ? (req.query.country as string[])
                : [req.query.country as string],
            query_type: req.query.query_type,
            page: req.query.page,
            limit: req.query.limit,
        });

        const { startDate, endDate, country, query_type, page, limit } = params;

        // Create a unique cache key based on query parameters
        const cacheKey = `comparison:${startDate}:${endDate}:${country.join(
            ','
        )}:${query_type}:page:${page}:limit:${limit}`;

        const readMongo = async () => {
            // Build MongoDB query
            const mongoQuery = {
                location: { $in: country },
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };

            // Pagination
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
            const aggregationPipeline: PipelineStage[] = [
                { $match: mongoQuery },
                {
                    $project: {
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$date',
                            },
                        },
                        location: { $toLower: '$location' },
                        value: { $ifNull: [`$${query_type}`, 0] },
                    },
                },
                {
                    $group: {
                        _id: '$date',
                        data: {
                            $push: {
                                k: '$location',
                                v: { $toDouble: '$value' },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        data: { $arrayToObject: '$data' },
                    },
                },
                { $sort: { date: 1 } },
                // { $skip: skip },
                { $limit: limit },
            ];

            // Fetch data from MongoDB
            const data = await CovidData.aggregate(aggregationPipeline).exec();

            // Transform data into desired format
            const response = data.map((item) => {
                return { date: item.date, ...item.data };
            });

            return response;
        };

        const response = await getCachedData(cacheKey, readMongo);
        res.status(200).json(response);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            logger.error('Error in getComparisonData:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
            });
        }
    }
};

export const getRegionsAggregatedData = async (req: Request, res: Response) => {
    try {
        const cacheKey = `regions-aggregates-essentials-093`;

        const readMongo = async () => {
            const aggregationPipeline: PipelineStage[] = [
                {
                    $group: {
                        _id: '$continent',
                        total_cases: { $sum: { $toDouble: '$total_cases' } },
                        total_deaths: { $sum: { $toDouble: '$total_deaths' } },
                        female_smokers: {
                            $avg: { $toDouble: '$female_smokers' },
                        },
                        male_smokers: { $avg: { $toDouble: '$male_smokers' } },
                        aged_65_older: { $avg: '$aged_65_older' },
                        aged_70_older: { $avg: '$aged_70_older' },
                    },
                },
            ];

            // Execute the aggregation pipeline
            const continentsData = await CovidData.aggregate(
                aggregationPipeline,
                {
                    allowDiskUse: true,
                }
            ).exec();

            return continentsData;
        };

        const continentsData = await getCachedData(cacheKey, readMongo);

        res.status(200).json(continentsData);
    } catch (error) {
        logger.error('Error fetching continents data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
        });
    }
};

export const getAverageVaccinatedData = async (req: Request, res: Response) => {
    try {
        const cacheKey = `vaccination-coverage`;

        const readMongo = async () => {
            const aggregationPipeline: PipelineStage[] = [
                {
                    $group: {
                        _id: '$iso_code',
                        average_vaccinated: {
                            $avg: {
                                $toDouble: {
                                    $ifNull: [
                                        '$people_vaccinated_per_hundred',
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        value: { $round: ['$average_vaccinated', 2] },
                    },
                },
            ];

            const result = await CovidData.aggregate(
                aggregationPipeline
            ).exec();
            return result;
        };

        const result = await getCachedData(cacheKey, readMongo);

        res.status(200).json(result);
    } catch (error) {
        logger.error('Error fetching average vaccination data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
        });
    }
};
