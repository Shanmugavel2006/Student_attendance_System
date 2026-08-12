import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_student_attendance_key_2026';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const isHead = (req, res, next) => {
  if (req.user && req.user.role === 'head') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access forbidden. Head / Central Department authorization required.' });
  }
};

export const isStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'head')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access forbidden. Staff authorization required.' });
  }
};

export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access forbidden. Student access only.' });
  }
};

export { JWT_SECRET };
