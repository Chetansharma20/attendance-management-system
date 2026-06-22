import express from 'express';
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import validateRoutes from './validateRoutes.js';
import overtimeRoutes from './overtimeRoutes.js';
import reportRoutes from './reportRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/validate', validateRoutes);
router.use('/overtime', overtimeRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

export default router;
