import express from 'express';
import { studentLogin, staffLogin, headLogin, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/student-login', studentLogin);
router.post('/staff-login', staffLogin);
router.post('/head-login', headLogin);
router.get('/me', verifyToken, getMe);

export default router;
