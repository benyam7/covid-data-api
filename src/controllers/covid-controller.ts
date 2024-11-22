import { Request, Response } from 'express';
import { z } from 'zod';
import { CovidData, ICovidData } from '../models/covid-data';
import redisClient from '../utils/redis-client';
import { PipelineStage } from 'mongoose';

const querySchema = z.object({
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
});

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

        // Check if data exists in cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            // Data found in cache, return it
            console.log('Data found in cache', JSON.parse(cachedData));
            res.json(JSON.parse(cachedData));
            return;
        }
        console.log('going to mongo');

        // Build MongoDB query
        const mongoQuery = {
            location: { $in: country },
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        };

        // Projection
        const projection = {
            date: 1,
            location: 1,
            [query_type]: 1,
            _id: 0,
        };

        // Pagination
        const skip = (page - 1) * limit;

        // Fetch data
        const data: ICovidData[] = await CovidData.find(mongoQuery, projection)
            .sort({ date: 1 })
            // .skip(skip)
            .limit(limit)
            .lean();

        console.log('data from mongo', data);
        // Transform data
        const response = data.reduce((acc: any[], curr) => {
            const dateStr = curr.date.toISOString().split('T')[0];
            let dateEntry = acc.find((entry) => entry.date === dateStr);

            if (!dateEntry) {
                dateEntry = { date: dateStr };
                acc.push(dateEntry);
            }

            dateEntry[curr.location.toLowerCase()] =
                curr[query_type as keyof ICovidData] || 0;

            return acc;
        }, []);
        console.log('response after transformation', response);
        // Store the result in Redis cache with an expiration time
        await redisClient.setEx(
            cacheKey,
            3600 * 24 * 7,
            JSON.stringify(response)
        ); // Cache for 1 week ( we could cache it forever as the data is not changing, but since i am on free plan I am limited by cache size)

        res.json(response);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
export const getRegionsAggregatedData = async (req: Request, res: Response) => {
    try {
        // Create a unique cache key
        const cacheKey = `regions-aggregates-essentials`;

        // Check if data exists in cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            // Data found in cache, return it
            console.log(
                'Region aggregates from cache:',
                JSON.parse(cachedData)
            );
            res.json(JSON.parse(cachedData));
            return;
        }

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
        const continentsData = await CovidData.aggregate(aggregationPipeline, {
            allowDiskUse: true,
        }).exec();

        // Cache the results
        await redisClient.setEx(
            cacheKey,
            3600 * 24 * 7,
            JSON.stringify(continentsData)
        ); // Cache for 1 week

        // Return the aggregated data
        res.json(continentsData);
    } catch (error) {
        console.error('Error fetching continents data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAverageVaccinatedData = async (req: Request, res: Response) => {
    try {
        // Create a unique cache key
        const cacheKey = `vaccination-coverage`;

        // Check if data exists in cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            // Data found in cache, return it
            console.log(
                'Region aggregates from cache:',
                JSON.parse(cachedData)
            );
            res.json(JSON.parse(cachedData));
            return;
        }

        const aggregationPipeline: PipelineStage[] = [
            {
                $group: {
                    _id: '$iso_code', // Group by ISO code
                    average_vaccinated: {
                        $avg: { $toDouble: '$people_vaccinated_per_hundred' },
                    },
                },
            },
            {
                $project: {
                    _id: 0, // Exclude MongoDB's default `_id`
                    id: '$_id', // ISO code as `id`
                    value: { $round: ['$average_vaccinated', 2] }, // Round to 2 decimal places
                },
            },
        ];

        const result = await CovidData.aggregate(aggregationPipeline).exec();
        // Cache the results
        await redisClient.setEx(
            cacheKey,
            3600 * 24 * 7,
            JSON.stringify(result)
        ); // Cache for 1 week

        res.json(result);
    } catch (error) {
        console.error('Error fetching average vaccination data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
