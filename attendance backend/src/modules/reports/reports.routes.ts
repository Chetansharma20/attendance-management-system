import express from 'express';
import verifyJWT from '../../middleware/authMiddleware.js';
import { getDailyPDFReport, getMonthlyReport, getTodayStats } from './reports.controller.js';

const router = express.Router();

router.get('/daily-pdf', verifyJWT as any, getDailyPDFReport as any);
router.get('/monthly', verifyJWT as any, getMonthlyReport as any);
router.get('/today-stats', verifyJWT as any, getTodayStats as any);

export default router;
