import express from 'express';
import { submitAttendance, getStudentAttendance, getClassAttendanceRecords } from '../controllers/attendanceController.js';
import { verifyToken, isStaff, isStudent } from '../middleware/authMiddleware.js';
import { checkAttendanceTimeWindow } from '../middleware/timeWindowMiddleware.js';

const router = express.Router();

router.post('/submit', verifyToken, isStaff, checkAttendanceTimeWindow, submitAttendance);
router.get('/student-records', verifyToken, isStudent, getStudentAttendance);
router.get('/class-records', verifyToken, getClassAttendanceRecords);

export default router;
