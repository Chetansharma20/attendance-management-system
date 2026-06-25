import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import {
  getAllAttendance,
  getAttendanceByEmployeeId,
  getMyAttendance,
  getTeamAttendance,
  punchIn,
  punchOut,
  startBreak,
  endBreak,
} from './attendance.controller.js';

const router = express.Router();

router.post('/punchin', verifyJWT as any, punchIn as any);
router.post('/punchout', verifyJWT as any, punchOut as any);
router.get('/my-attendance', verifyJWT as any, getMyAttendance as any);
router.get('/getattendancebyid/:employeeId', verifyJWT as any, getAttendanceByEmployeeId as any);
router.get('/team-attendance', verifyJWT as any, allowedRoles(['admin', 'manager']) as any, getTeamAttendance as any);
router.get('/all-attendance', verifyJWT as any, allowedRoles(['admin', 'manager']) as any, getAllAttendance as any);
router.post('/break/start', verifyJWT as any, startBreak as any);
router.post('/break/end', verifyJWT as any, endBreak as any);

export default router;
