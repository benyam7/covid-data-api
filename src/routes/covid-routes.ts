import { Router } from 'express';
import {
    getAverageVaccinatedData,
    getComparisonData,
    getRegionsAggregatedData,
} from '../controllers/covid-controller';

const router = Router();

router.get('/comparison', getComparisonData);
router.get('/region-aggregations', getRegionsAggregatedData);
router.get('/vaccination-coverage', getAverageVaccinatedData);

export default router;
