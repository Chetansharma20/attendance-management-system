import express from 'express';
import verifyJWT, { allowedRoles } from '../middleware/authMiddleware.js';
import { getAllAttendance, getAttendanceByEmployeeId, getMyAttendance, getTeamAttendance, punchIn , punchOut } from '../controllers/attendancecontroller.js';

const attendanceRoutes = express.Router();

attendanceRoutes.post('/punchin', verifyJWT, punchIn);
attendanceRoutes.post('/punchout', verifyJWT, punchOut)
attendanceRoutes.get('/my-attendance', verifyJWT, getMyAttendance);
attendanceRoutes.get('/getattendancebyid/:employeeId', verifyJWT, getAttendanceByEmployeeId);
attendanceRoutes.get('/team-attendance', verifyJWT, allowedRoles(['admin', 'manager']), getTeamAttendance);
attendanceRoutes.get('/all-attendance', verifyJWT, allowedRoles(['admin', 'manager']), getAllAttendance);
export default attendanceRoutes;
