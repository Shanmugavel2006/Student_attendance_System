import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Student Attendance Management System API',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`\n🚀 Backend REST API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
