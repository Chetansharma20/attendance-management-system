import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import { getMyRequests, getPendingOvertime, requestOvertime, updateOvertimeStatus, getAllOvertimes, deleteOvertime } from './overtime.controller.js';

const router = express.Router();

router.post('/request', verifyJWT, requestOvertime);
router.get('/pending', verifyJWT, getPendingOvertime);
router.get('/all', verifyJWT, allowedRoles(['admin']), getAllOvertimes);
router.patch('/status', verifyJWT, allowedRoles(['admin', 'manager']), updateOvertimeStatus);
router.get('/myrequests', verifyJWT, getMyRequests);
router.delete('/:id', verifyJWT, allowedRoles(['admin']), deleteOvertime);

export default router;
