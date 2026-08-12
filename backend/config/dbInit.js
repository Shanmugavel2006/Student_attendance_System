import pool from './db.js';

/**
 * Auto-initialize database tables and seed data if MySQL is available
 */
export const initializeDatabase = async () => {
  if (!pool) return;

  try {
    const connection = await pool.getConnection();

    // 1. Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('head', 'staff', 'student') NOT NULL,
        department VARCHAR(100),
        year VARCHAR(50),
        class_section VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Students Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        register_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        year VARCHAR(50) NOT NULL,
        class_section VARCHAR(50) NOT NULL,
        parent_name VARCHAR(100) NOT NULL,
        parent_mobile VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Create Timetables Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department VARCHAR(100) NOT NULL,
        year VARCHAR(50) NOT NULL,
        class_section VARCHAR(50) NOT NULL,
        day_of_week VARCHAR(20) NOT NULL,
        session_time VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        faculty_name VARCHAR(100) NOT NULL,
        room VARCHAR(50) DEFAULT 'Room 101'
      )
    `);

    // 4. Create Exam Timetables Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exam_timetables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department VARCHAR(100) NOT NULL,
        year VARCHAR(50) NOT NULL,
        class_section VARCHAR(50) NOT NULL,
        exam_date DATE NOT NULL,
        subject VARCHAR(100) NOT NULL,
        exam_time VARCHAR(50) NOT NULL,
        semester VARCHAR(50) NOT NULL,
        exam_hall VARCHAR(50) DEFAULT 'Hall A'
      )
    `);

    // 5. Create Attendance Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        year VARCHAR(50) NOT NULL,
        class_section VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        attendance_date DATE NOT NULL,
        session ENUM('Morning', 'Afternoon') NOT NULL,
        status ENUM('Present', 'Absent') NOT NULL,
        marked_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_att (student_id, attendance_date, session, subject),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 6. Create SMS Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        parent_mobile VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        attendance_date DATE NOT NULL,
        session VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'SENT',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default Head, Staff, and Students if Users table is empty
    const [[{ userCount }]] = await connection.query(`SELECT COUNT(*) as userCount FROM users`);

    if (userCount === 0) {
      console.log('🌱 Seeding initial records into MySQL database...');

      // Add Head User
      await connection.query(`
        INSERT INTO users (id, name, email, password, role, department, year, class_section) VALUES
        (1, 'Dr. R. Sharma (Head of Dept)', 'head@college.edu', 'head', 'head', 'Computer Science & Engineering', 'All', 'All')
      `);

      // Add Staff User
      await connection.query(`
        INSERT INTO users (id, name, email, password, role, department, year, class_section) VALUES
        (2, 'Prof. A. Kumar', 'staff@college.edu', 'staff', 'staff', 'Computer Science & Engineering', '3rd Year', 'CSE-A')
      `);

      // Add Students Users
      await connection.query(`
        INSERT INTO users (id, name, email, password, role, department, year, class_section) VALUES
        (3, 'Alex Johnson', 'student@college.edu', 'student', 'student', 'Computer Science & Engineering', '3rd Year', 'CSE-A'),
        (4, 'Priya Patel', 'priya@college.edu', 'student', 'student', 'Computer Science & Engineering', '3rd Year', 'CSE-A'),
        (5, 'Rahul Verma', 'rahul@college.edu', 'student', 'student', 'Computer Science & Engineering', '3rd Year', 'CSE-A')
      `);

      // Add Student details
      await connection.query(`
        INSERT INTO students (id, user_id, register_number, name, department, year, class_section, parent_name, parent_mobile, email) VALUES
        (1, 3, '2023CSE001', 'Alex Johnson', 'Computer Science & Engineering', '3rd Year', 'CSE-A', 'Robert Johnson', '+19876543210', 'student@college.edu'),
        (2, 4, '2023CSE002', 'Priya Patel', 'Computer Science & Engineering', '3rd Year', 'CSE-A', 'Suresh Patel', '+19876543211', 'priya@college.edu'),
        (3, 5, '2023CSE003', 'Rahul Verma', 'Computer Science & Engineering', '3rd Year', 'CSE-A', 'Vikram Verma', '+19876543212', 'rahul@college.edu')
      `);

      // Add Class Timetables
      await connection.query(`
        INSERT INTO timetables (department, year, class_section, day_of_week, session_time, subject, faculty_name, room) VALUES
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Monday', '09:00 - 10:00 AM', 'Database Management Systems', 'Prof. A. Kumar', 'Lab 3'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Monday', '10:00 - 11:00 AM', 'Operating Systems', 'Dr. S. Nair', 'Room 302'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Monday', '01:50 - 02:30 PM', 'Web Technology Lab', 'Prof. A. Kumar', 'Lab 1'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Tuesday', '09:00 - 10:00 AM', 'Computer Networks', 'Prof. M. Gupta', 'Room 302'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Wednesday', '09:00 - 10:00 AM', 'Software Engineering', 'Dr. R. Sharma', 'Room 302')
      `);

      // Add Exam Timetables
      await connection.query(`
        INSERT INTO exam_timetables (department, year, class_section, exam_date, subject, exam_time, semester, exam_hall) VALUES
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-15', 'Database Management Systems', '10:00 AM - 01:00 PM', 'Semester 5', 'Main Exam Hall A'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-17', 'Operating Systems', '10:00 AM - 01:00 PM', 'Semester 5', 'Main Exam Hall B'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-19', 'Computer Networks', '10:00 AM - 01:00 PM', 'Semester 5', 'Main Exam Hall A'),
        ('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-22', 'Web Technology', '02:00 PM - 05:00 PM', 'Semester 5', 'Lab 1')
      `);

      console.log('✅ MySQL Database auto-seeded with default schema & records successfully!');
    }

    connection.release();
  } catch (err) {
    console.error('⚠️ Note: MySQL auto-init check complete (using fallback if connection details not configured):', err.message);
  }
};
