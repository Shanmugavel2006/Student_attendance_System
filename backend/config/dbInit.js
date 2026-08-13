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
        student_mobile VARCHAR(20),
        parent_name VARCHAR(100) NOT NULL,
        parent_mobile VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Safe migration: add student_mobile column if it doesn't already exist
    try {
      await connection.query(`ALTER TABLE students ADD COLUMN student_mobile VARCHAR(20) DEFAULT '' AFTER class_section`);
      console.log('✅ Added student_mobile column to students table.');
    } catch (alterErr) {
      if (alterErr.errno !== 1060) { // 1060 = Duplicate column name (already exists)
        console.warn('⚠️ Could not add student_mobile column:', alterErr.message);
      }
    }

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

    // Seed ONLY the Head admin user if Users table is empty.
    // Staff must be added by Head via Head Dashboard.
    // Students must be added by Staff via Staff Dashboard.
    const [[{ userCount }]] = await connection.query(`SELECT COUNT(*) as userCount FROM users`);

    if (userCount === 0) {
      console.log('🌱 Seeding initial Head admin user into MySQL database...');

      // Only seed the Head (Department Head) — no default staff or students
      await connection.query(`
        INSERT INTO users (name, email, password, role, department, year, class_section) VALUES
        ('Head of Department', 'head@college.edu', 'head123', 'head', '', 'All', 'All')
      `);

      console.log('✅ MySQL Database initialized with Head admin only. Staff & Students are managed via the dashboard.');
    } else {
      // Clean up old default demo accounts if they still exist from previous seeding
      const demoEmails = ['staff@college.edu', 'student@college.edu', 'priya@college.edu', 'rahul@college.edu'];
      for (const demoEmail of demoEmails) {
        try {
          // Remove student record first (FK constraint)
          await connection.query(`DELETE FROM students WHERE email = ?`, [demoEmail]);
          await connection.query(`DELETE FROM users WHERE email = ? AND email != 'head@college.edu'`, [demoEmail]);
        } catch (cleanErr) {
          // Ignore errors during cleanup (e.g. record already deleted)
        }
      }
    }

    connection.release();
  } catch (err) {
    console.error('⚠️ Note: MySQL auto-init check complete (using fallback if connection details not configured):', err.message);
  }
};
