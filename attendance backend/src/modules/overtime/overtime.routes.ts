import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import { getMyRequests, getPendingOvertime, requestOvertime, updateOvertimeStatus } from './overtime.controller.js';

const router = express.Router();

router.post('/request', verifyJWT, requestOvertime);
router.get('/pending', verifyJWT, getPendingOvertime);
router.patch('/status', verifyJWT, allowedRoles(['admin', 'manager']), updateOvertimeStatus);
router.get('/myrequests', verifyJWT, getMyRequests);

export default router;
