import express from 'express';
import { getClassTimetable, getExamTimetable } from '../controllers/timetableController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/class', verifyToken, getClassTimetable);
router.get('/exam', verifyToken, getExamTimetable);

export default router;
