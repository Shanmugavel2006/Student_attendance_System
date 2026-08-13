-- Student Attendance Management System - Database Schema

CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 1. Users Table (Stores Admin/Head, Staff/Teacher, and Student credentials)
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
);

-- 2. Student Details Table (Extends User information for students)
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
);

-- 3. Subjects & Timetable Table
CREATE TABLE IF NOT EXISTS timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(50) NOT NULL,
    class_section VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday, etc.
    session_time VARCHAR(50) NOT NULL, -- e.g. 09:00 - 10:00 AM
    subject VARCHAR(100) NOT NULL,
    faculty_name VARCHAR(100) NOT NULL,
    room VARCHAR(50) DEFAULT 'Room 101'
);

-- 4. Exam Timetable Table
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
);

-- 5. Attendance Records Table
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
    marked_by INT NOT NULL, -- Staff User ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 6. SMS Log Table (Tracks parent absent notifications)
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
);
