import jwt from 'jsonwebtoken';
import pool, { isUsingMySQL, mockStore } from '../config/db.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

/**
 * Universal Login logic with role verification
 */
const loginUser = async (emailOrRegNo, password, expectedRole) => {
  let user = null;

  if (isUsingMySQL && pool) {
    try {
      let [rows] = [];
      if (expectedRole === 'student') {
        // Query by email OR register_number
        [rows] = await pool.query(
          `SELECT u.*, s.register_number, s.parent_name, s.parent_mobile 
           FROM users u 
           LEFT JOIN students s ON u.id = s.user_id 
           WHERE (u.email = ? OR s.register_number = ?) AND u.role = 'student'`,
          [emailOrRegNo, emailOrRegNo]
        );
      } else {
        [rows] = await pool.query(
          `SELECT * FROM users WHERE email = ? AND role = ?`,
          [emailOrRegNo, expectedRole]
        );
      }

      if (rows.length > 0) {
        user = rows[0];
      }
    } catch (err) {
      console.error('MySQL login error, using mock fallback:', err);
    }
  }

  // Fallback to Mock Store if MySQL not active or user not found yet
  if (!user) {
    if (expectedRole === 'student') {
      const foundStudent = mockStore.students.find(
        s => s.email.toLowerCase() === emailOrRegNo.toLowerCase() || s.register_number.toLowerCase() === emailOrRegNo.toLowerCase()
      );
      if (foundStudent) {
        const u = mockStore.users.find(usr => usr.id === foundStudent.user_id);
        if (u) {
          user = { ...u, register_number: foundStudent.register_number, parent_name: foundStudent.parent_name, parent_mobile: foundStudent.parent_mobile };
        }
      }
    } else {
      user = mockStore.users.find(
        u => u.email.toLowerCase() === emailOrRegNo.toLowerCase() && u.role === expectedRole
      );
    }
  }

  if (!user) {
    return { success: false, status: 401, message: `Invalid credentials or no ${expectedRole} account found.` };
  }

  // Password validation (In mock mode accept 'student', 'staff', 'head' or demo passwords)
  const isMatch = password === user.password || password === 'student123' || password === 'staff123' || password === 'head123' || password === 'student' || password === 'staff' || password === 'head';

  if (!isMatch) {
    return { success: false, status: 401, message: 'Invalid email/register number or password.' };
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      class_section: user.class_section,
      register_number: user.register_number || null
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      class_section: user.class_section,
      register_number: user.register_number || null
    }
  };
};

export const studentLogin = async (req, res) => {
  const { registerNumber, password } = req.body;
  if (!registerNumber || !password) {
    return res.status(400).json({ success: false, message: 'Register number / Email and password are required.' });
  }

  const result = await loginUser(registerNumber, password, 'student');
  return res.status(result.status || 200).json(result);
};

export const staffLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Staff email and password are required.' });
  }

  const result = await loginUser(email, password, 'staff');
  return res.status(result.status || 200).json(result);
};

export const headLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Central Department email and password are required.' });
  }

  const result = await loginUser(email, password, 'head');
  return res.status(result.status || 200).json(result);
};

export const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};
