import express from 'express';
import { getStudentsByClass, addStudent, updateStudent } from '../controllers/studentController.js';
import { verifyToken, isStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getStudentsByClass);
router.post('/', verifyToken, isStaff, addStudent);
router.put('/:id', verifyToken, isStaff, updateStudent);

export default router;
