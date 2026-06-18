import express from 'express';

import verifyJWT, { allowedRoles } from '../middleware/authMiddleware.js';
import { getMyRequests, getPendingOvertime, requestOvertime, updateOvertimeStatus } from '../controllers/overtimerequestcontroller.js';

const overtimeRoutes = express.Router();

overtimeRoutes.post('/request',  verifyJWT, requestOvertime);
overtimeRoutes.get('/pending', verifyJWT, getPendingOvertime);
overtimeRoutes.patch('/status', verifyJWT, allowedRoles(['admin', 'manager']), updateOvertimeStatus);
overtimeRoutes.get('/myrequests', verifyJWT, getMyRequests);
export default overtimeRoutes;
