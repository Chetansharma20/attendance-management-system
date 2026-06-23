import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import {
  getAllAttendance,
  getAttendanceByEmployeeId,
  getMyAttendance,
  getTeamAttendance,
  managerPunch,
  punchIn,
  punchOut,
} from './attendance.controller.js';

const router = express.Router();

router.post('/punchin', verifyJWT, punchIn);
router.post('/punchout', verifyJWT, punchOut);
router.get('/my-attendance', verifyJWT, getMyAttendance);
router.get('/getattendancebyid/:employeeId', verifyJWT, getAttendanceByEmployeeId);
router.get('/team-attendance', verifyJWT, allowedRoles(['admin', 'manager']), getTeamAttendance);
router.get('/all-attendance', verifyJWT, allowedRoles(['admin', 'manager']), getAllAttendance);
router.post('/manager-punch', verifyJWT, allowedRoles(['admin', 'manager']), managerPunch);

export default router;
