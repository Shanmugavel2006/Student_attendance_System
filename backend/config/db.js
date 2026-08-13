import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// =====================================================
// IN-MEMORY MOCK STORE
// Used only when MySQL is unavailable
// =====================================================

export const mockStore = {
  users: [
    {
      id: 1,
      name: "Head of Department",
      email: "head@college.edu",
      password: "head123",
      role: "head",
      department: "",
      year: "All",
      class_section: "All"
    }
    // Staff are added by Head via HeadDashboard → /api/staff POST (isHead)
    // Students are added by Staff via StaffDashboard → /api/students POST (isStaff)
  ],

  // No default students — all students are added by Staff via StaffDashboard
  students: [],

  timetables: [
    {
      id: 1,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      day_of_week: "Monday",
      session_time: "09:00 - 10:00 AM",
      subject: "Database Management Systems",
      faculty_name: "Prof. A. Kumar",
      room: "Lab 3"
    },
    {
      id: 2,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      day_of_week: "Monday",
      session_time: "10:00 - 11:00 AM",
      subject: "Operating Systems",
      faculty_name: "Dr. S. Nair",
      room: "Room 302"
    },
    {
      id: 3,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      day_of_week: "Monday",
      session_time: "01:50 - 02:30 PM",
      subject: "Web Technology Lab",
      faculty_name: "Prof. A. Kumar",
      room: "Lab 1"
    },
    {
      id: 4,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      day_of_week: "Tuesday",
      session_time: "09:00 - 10:00 AM",
      subject: "Computer Networks",
      faculty_name: "Prof. M. Gupta",
      room: "Room 302"
    },
    {
      id: 5,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      day_of_week: "Wednesday",
      session_time: "09:00 - 10:00 AM",
      subject: "Software Engineering",
      faculty_name: "Dr. R. Sharma",
      room: "Room 302"
    }
  ],

  exam_timetables: [
    {
      id: 1,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      exam_date: "2026-09-15",
      subject: "Database Management Systems",
      exam_time: "10:00 AM - 01:00 PM",
      semester: "Semester 5",
      exam_hall: "Main Exam Hall A"
    },
    {
      id: 2,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      exam_date: "2026-09-17",
      subject: "Operating Systems",
      exam_time: "10:00 AM - 01:00 PM",
      semester: "Semester 5",
      exam_hall: "Main Exam Hall B"
    },
    {
      id: 3,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      exam_date: "2026-09-19",
      subject: "Computer Networks",
      exam_time: "10:00 AM - 01:00 PM",
      semester: "Semester 5",
      exam_hall: "Main Exam Hall A"
    },
    {
      id: 4,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      exam_date: "2026-09-22",
      subject: "Web Technology",
      exam_time: "02:00 PM - 05:00 PM",
      semester: "Semester 5",
      exam_hall: "Lab 1"
    }
  ],

  attendance: [
    // Student 1 (Alex Johnson - 2023CSE001)
    // July 2026
    { id: 1, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Database Management Systems", attendance_date: "2026-07-27", session: "Morning", status: "Present", marked_by: 2 },
    { id: 2, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Operating Systems", attendance_date: "2026-07-27", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 3, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Computer Networks", attendance_date: "2026-07-28", session: "Morning", status: "Present", marked_by: 2 },
    { id: 4, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Digital Forensics", attendance_date: "2026-07-28", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 5, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Software Engineering", attendance_date: "2026-07-29", session: "Morning", status: "Absent", marked_by: 2 },
    { id: 6, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Cloud Computing", attendance_date: "2026-07-29", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 7, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Data Mining And Visualisation", attendance_date: "2026-07-30", session: "Morning", status: "Present", marked_by: 2 },
    { id: 8, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Web Technology Lab", attendance_date: "2026-07-30", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 9, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Operating Systems", attendance_date: "2026-07-31", session: "Morning", status: "Present", marked_by: 2 },
    { id: 10, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Database Management Systems", attendance_date: "2026-07-31", session: "Afternoon", status: "Present", marked_by: 2 },

    // August 2026
    { id: 11, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Database Management Systems", attendance_date: "2026-08-03", session: "Morning", status: "Present", marked_by: 2 },
    { id: 12, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Operating Systems", attendance_date: "2026-08-03", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 13, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Computer Networks", attendance_date: "2026-08-04", session: "Morning", status: "Present", marked_by: 2 },
    { id: 14, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Web Technology Lab", attendance_date: "2026-08-04", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 15, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Software Engineering", attendance_date: "2026-08-05", session: "Morning", status: "Present", marked_by: 2 },
    { id: 16, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Cloud Computing", attendance_date: "2026-08-05", session: "Afternoon", status: "Absent", marked_by: 2 },
    { id: 17, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Data Mining And Visualisation", attendance_date: "2026-08-06", session: "Morning", status: "Present", marked_by: 2 },
    { id: 18, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Digital Forensics", attendance_date: "2026-08-06", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 19, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Software Engineering", attendance_date: "2026-08-07", session: "Morning", status: "Present", marked_by: 2 },
    { id: 20, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Cloud Computing", attendance_date: "2026-08-07", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 21, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Database Management Systems", attendance_date: "2026-08-10", session: "Morning", status: "Present", marked_by: 2 },
    { id: 22, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Operating Systems", attendance_date: "2026-08-10", session: "Afternoon", status: "Present", marked_by: 2 },
    { id: 23, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Computer Networks", attendance_date: "2026-08-11", session: "Morning", status: "Present", marked_by: 2 },
    { id: 24, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Data Mining And Visualisation", attendance_date: "2026-08-11", session: "Afternoon", status: "Absent", marked_by: 2 },
    { id: 25, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Database Management Systems", attendance_date: "2026-08-12", session: "Morning", status: "Present", marked_by: 2 },
    { id: 26, student_id: 1, register_number: "2023CSE001", department: "Computer Science & Engineering", year: "3rd Year", class_section: "CSE-A", subject: "Software Engineering", attendance_date: "2026-08-12", session: "Afternoon", status: "Present", marked_by: 2 }
  ],

  sms_logs: []
};

// =====================================================
// MYSQL CONNECTION
// =====================================================

let pool = null;

export let isUsingMySQL = false;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "attendance_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test MySQL connection
  pool.getConnection()
    .then((connection) => {

      console.log("======================================");
      console.log("✅ MySQL Connected Successfully!");
      console.log("======================================");
      console.log("Host     :", process.env.DB_HOST || "localhost");
      console.log("Port     :", process.env.DB_PORT || 3306);
      console.log("User     :", process.env.DB_USER || "root");
      console.log("Database :", process.env.DB_NAME || "attendance_db");
      console.log("======================================");

      isUsingMySQL = true;

      connection.release();
    })
    .catch((error) => {

      console.log("======================================");
      console.log("❌ MySQL Connection Failed!");
      console.log("======================================");
      console.log("Error Code    :", error.code);
      console.log("Error Message :", error.message);
      console.log("======================================");
      console.log("⚠️ Using In-Memory Mock Store instead.");
      console.log("======================================");

      isUsingMySQL = false;
    });

} catch (error) {

  console.log("======================================");
  console.log("❌ MySQL Initialization Failed!");
  console.log("======================================");
  console.log("Error:", error.message);
  console.log("======================================");

  isUsingMySQL = false;
}

export default pool;