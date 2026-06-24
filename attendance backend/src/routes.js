import express from 'express';
import authRoutes     from './modules/auth/auth.routes.js';
import userRoutes     from './modules/user/user.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import validateRoutes from './modules/validate/validate.routes.js';
import overtimeRoutes from './modules/overtime/overtime.routes.js';
import reportRoutes   from './modules/reports/reports.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import shiftRoutes    from './modules/shift/shift.routes.js';
import leaveRoutes    from './modules/leave/leave.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';

const router = express.Router();

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/attendance',    attendanceRoutes);
router.use('/validate',      validateRoutes);
router.use('/overtime',      overtimeRoutes);
router.use('/reports',       reportRoutes);
router.use('/settings',      settingsRoutes);
router.use('/shifts',        shiftRoutes);
router.use('/leave',         leaveRoutes);
router.use('/notifications', notificationRoutes);

export default router;
