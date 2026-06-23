import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import { validateAttendance } from './validate.controller.js';

const router = express.Router();

router.post('/validateattendance/:attendanceId', verifyJWT, allowedRoles(['admin', 'manager']), validateAttendance);

export default router;
