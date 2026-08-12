import express from 'express';
import { getAllStaff, addStaff, updateStaff, deleteStaff } from '../controllers/staffController.js';
import { verifyToken, isHead } from '../middleware/authMiddleware.js';

const router = express.Router();

// All staff routes are Head-only
router.get('/', verifyToken, isHead, getAllStaff);
router.post('/', verifyToken, isHead, addStaff);
router.put('/:id', verifyToken, isHead, updateStaff);
router.delete('/:id', verifyToken, isHead, deleteStaff);

export default router;
