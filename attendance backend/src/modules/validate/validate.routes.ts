import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import { validateAttendance } from './validate.controller.js';

const router = express.Router();

router.post('/validateattendance/:attendanceId', verifyJWT as any, allowedRoles(['admin', 'manager']) as any, validateAttendance as any);

export default router;
