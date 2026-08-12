import express from 'express';
import { getHeadDashboardStats, getAttendanceReports, getSmsLogs, headSendSMS } from '../controllers/reportController.js';
import { verifyToken, isHead } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard-stats', verifyToken, isHead, getHeadDashboardStats);
router.get('/attendance-reports', verifyToken, isHead, getAttendanceReports);
router.get('/sms-logs', verifyToken, isHead, getSmsLogs);
router.post('/send-sms', verifyToken, isHead, headSendSMS);

export default router;
