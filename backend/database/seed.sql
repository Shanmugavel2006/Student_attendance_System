-- Sample Seed Data for Student Attendance Management System

USE attendance_db;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE sms_logs;
TRUNCATE TABLE attendance;
TRUNCATE TABLE exam_timetables;
TRUNCATE TABLE timetables;
TRUNCATE TABLE students;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users (Default passwords are bcrypt hashed 'head123', 'staff123', 'student123')
INSERT INTO users (id, name, email, password, role, department, year, class_section) VALUES
(1, 'Dr. R. Sharma (Head of Dept)', 'head@college.edu', '$2a$10$wN9P34j5e5q/y1W5Yy24ueWq2Gf3o8n4v.Qk7X0g3v5v1v2v3v4v5', 'head', 'Computer Science & Engineering', 'All', 'All'),
(2, 'Prof. A. Kumar', 'staff@college.edu', '$2a$10$wN9P34j5e5q/y1W5Yy24ueWq2Gf3o8n4v.Qk7X0g3v5v1v2v3v4v5', 'staff', 'Computer Science & Engineering', '3rd Year', 'CSE-A'),
(3, 'Alex Johnson', 'student@college.edu', '$2a$10$wN9P34j5e5q/y1W5Yy24ueWq2Gf3o8n4v.Qk7X0g3v5v1v2v3v4v5', 'student', 'Computer Science & Engineering', '3rd Year', 'CSE-A'),
(4, 'Priya Patel', 'priya@college.edu', '$2a$10$wN9P34j5e5q/y1W5Yy24ueWq2Gf3o8n4v.Qk7X0g3v5v1v2v3v4v5', 'student', 'Computer Science & Engineering', '3rd Year', 'CSE-A'),
(5, 'Rahul Verma', 'rahul@college.edu', '$2a$10$wN9P34j5e5q/y1W5Yy24ueWq2Gf3o8n4v.Qk7X0g3v5v1v2v3v4v5', 'student', 'Computer Science & Engineering', '3rd Year', 'CSE-A');

-- Student Details
INSERT INTO students (id, user_id, register_number, name, department, year, class_section, parent_name, parent_mobile, email) VALUES
(1, 3, '2023CSE001', 'Alex Johnson', 'Computer Science & Engineering', '3rd Year', 'CSE-A', 'Robert Johnson', '+19876543210', 'student@college.edu'),
(2, 4, '2023CSE002', 'Priya Patel', 'Computer Science & Engineering', '3rd Year', 'CSE-A', 'Suresh Patel', '+19876543211', 'priya@college.edu'),
(3, 5, '2023CSE003', 'Rahul Verma', 'Computer Science & Engineering', '3rd Year', 'CSE-A', 'Vikram Verma', '+19876543212', 'rahul@college.edu');

-- Timetable
INSERT INTO timetables (department, year, class_section, day_of_week, session_time, subject, faculty_name, room) VALUES
('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Monday', '09:00 - 10:00 AM', 'Database Management Systems', 'Prof. A. Kumar', 'Lab 3'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Monday', '10:00 - 11:00 AM', 'Operating Systems', 'Dr. S. Nair', 'Room 302'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Monday', '01:50 - 02:30 PM', 'Web Technology Lab', 'Prof. A. Kumar', 'Lab 1'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Tuesday', '09:00 - 10:00 AM', 'Computer Networks', 'Prof. M. Gupta', 'Room 302'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', 'Wednesday', '09:00 - 10:00 AM', 'Software Engineering', 'Dr. R. Sharma', 'Room 302');

-- Exam Timetable
INSERT INTO exam_timetables (department, year, class_section, exam_date, subject, exam_time, semester, exam_hall) VALUES
('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-15', 'Database Management Systems', '10:00 AM - 01:00 PM', 'Semester 5', 'Main Exam Hall A'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-17', 'Operating Systems', '10:00 AM - 01:00 PM', 'Semester 5', 'Main Exam Hall B'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-19', 'Computer Networks', '10:00 AM - 01:00 PM', 'Semester 5', 'Main Exam Hall A'),
('Computer Science & Engineering', '3rd Year', 'CSE-A', '2026-09-22', 'Web Technology', '02:00 PM - 05:00 PM', 'Semester 5', 'Lab 1');
