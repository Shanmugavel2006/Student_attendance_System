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
      name: "Dr. R. Sharma (Head of Dept)",
      email: "head@college.edu",
      password: "head",
      role: "head",
      department: "Computer Science & Engineering",
      year: "All",
      class_section: "All"
    },
    {
      id: 2,
      name: "Prof. A. Kumar",
      email: "staff@college.edu",
      password: "staff",
      role: "staff",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A"
    },
    {
      id: 3,
      name: "Alex Johnson",
      email: "student@college.edu",
      password: "student",
      role: "student",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A"
    },
    {
      id: 4,
      name: "Priya Patel",
      email: "priya@college.edu",
      password: "student",
      role: "student",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A"
    },
    {
      id: 5,
      name: "Rahul Verma",
      email: "rahul@college.edu",
      password: "student",
      role: "student",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A"
    }
  ],

  students: [
    {
      id: 1,
      user_id: 3,
      register_number: "2023CSE001",
      name: "Alex Johnson",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      parent_name: "Robert Johnson",
      parent_mobile: "+19876543210",
      email: "student@college.edu"
    },
    {
      id: 2,
      user_id: 4,
      register_number: "2023CSE002",
      name: "Priya Patel",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      parent_name: "Suresh Patel",
      parent_mobile: "+19876543211",
      email: "priya@college.edu"
    },
    {
      id: 3,
      user_id: 5,
      register_number: "2023CSE003",
      name: "Rahul Verma",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      parent_name: "Vikram Verma",
      parent_mobile: "+19876543212",
      email: "rahul@college.edu"
    }
  ],

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
    {
      id: 1,
      student_id: 1,
      register_number: "2023CSE001",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      subject: "Database Management Systems",
      attendance_date: "2026-08-10",
      session: "Morning",
      status: "Present",
      marked_by: 2
    },
    {
      id: 2,
      student_id: 2,
      register_number: "2023CSE002",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      subject: "Database Management Systems",
      attendance_date: "2026-08-10",
      session: "Morning",
      status: "Present",
      marked_by: 2
    },
    {
      id: 3,
      student_id: 3,
      register_number: "2023CSE003",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      class_section: "CSE-A",
      subject: "Database Management Systems",
      attendance_date: "2026-08-10",
      session: "Morning",
      status: "Absent",
      marked_by: 2
    }
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