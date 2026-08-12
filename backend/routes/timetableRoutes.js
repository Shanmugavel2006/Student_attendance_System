import express from 'express';
import {
  getClassTimetable,
  getExamTimetable,
  addClassTimetable,
  deleteClassTimetable,
  addExamTimetable,
  deleteExamTimetable
} from '../controllers/timetableController.js';
import { verifyToken, isStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/class', verifyToken, getClassTimetable);
router.post('/class', verifyToken, isStaff, addClassTimetable);
router.delete('/class/:id', verifyToken, isStaff, deleteClassTimetable);

router.get('/exam', verifyToken, getExamTimetable);
router.post('/exam', verifyToken, isStaff, addExamTimetable);
router.delete('/exam/:id', verifyToken, isStaff, deleteExamTimetable);

export default router;
