import express from 'express';
import { getStudentsByClass, addStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { verifyToken, isStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getStudentsByClass);
router.post('/', verifyToken, isStaff, addStudent);
router.put('/:id', verifyToken, isStaff, updateStudent);
router.delete('/:id', verifyToken, isStaff, deleteStudent);

export default router;
