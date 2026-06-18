import express from 'express';
import verifyJWT, { allowedRoles } from '../middleware/authMiddleware.js';
import { validateAttendance } from '../controllers/validateController.js';

const validateRoutes = express.Router();

validateRoutes.post('/validateattendance/:attendanceId', verifyJWT, allowedRoles(['admin','manager']), validateAttendance);

export default validateRoutes;