import pool, { isUsingMySQL, mockStore } from '../config/db.js';
import { sendParentAbsenceSMS } from '../config/sms.js';

/**
 * Head / Central Department Dashboard Overview Stats
 */
export const getHeadDashboardStats = async (req, res) => {
  let totalStudents = 0;
  let totalStaff = 0;
  let totalAttendanceMarked = 0;
  let overallPercentage = 88.5;
  let recentAbsents = [];

  if (isUsingMySQL && pool) {
    try {
      const [[{ stdCount }]] = await pool.query(`SELECT COUNT(*) as stdCount FROM students`);
      totalStudents = stdCount;

      const [[{ stfCount }]] = await pool.query(`SELECT COUNT(*) as stfCount FROM users WHERE role = 'staff'`);
      totalStaff = stfCount;

      const [[{ attCount }]] = await pool.query(`SELECT COUNT(*) as attCount FROM attendance`);
      totalAttendanceMarked = attCount;

      const [absentRows] = await pool.query(
        `SELECT a.*, s.name as student_name, s.parent_mobile 
         FROM attendance a 
         JOIN students s ON a.student_id = s.id 
         WHERE a.status = 'Absent' 
         ORDER BY a.created_at DESC LIMIT 10`
      );
      recentAbsents = absentRows;
    } catch (err) {
      console.error('Error fetching Head stats from MySQL:', err);
    }
  }

  if (totalStudents === 0) {
    totalStudents = mockStore.students.length;
    totalStaff = mockStore.users.filter(u => u.role === 'staff').length;
    totalAttendanceMarked = mockStore.attendance.length;
    recentAbsents = mockStore.attendance
      .filter(a => a.status === 'Absent')
      .map(a => {
        const std = mockStore.students.find(s => s.id === a.student_id);
        return {
          ...a,
          student_name: std ? std.name : 'Student',
          parent_mobile: std ? std.parent_mobile : 'N/A'
        };
      });
  }

  return res.json({
    success: true,
    stats: {
      totalStudents,
      totalStaff,
      totalAttendanceMarked,
      overallPercentage,
      recentAbsents
    }
  });
};

/**
 * Filtered Attendance Reports for Head / Central Dept
 */
export const getAttendanceReports = async (req, res) => {
  const { department, year, classSection, subject, date } = req.query;

  let records = [];

  if (isUsingMySQL && pool) {
    try {
      let query = `SELECT a.*, s.name as student_name, s.register_number, s.parent_mobile 
                   FROM attendance a 
                   JOIN students s ON a.student_id = s.id 
                   WHERE 1=1`;
      const params = [];

      if (department) { query += ` AND a.department = ?`; params.push(department); }
      if (year) { query += ` AND a.year = ?`; params.push(year); }
      if (classSection) { query += ` AND a.class_section = ?`; params.push(classSection); }
      if (subject) { query += ` AND a.subject = ?`; params.push(subject); }
      if (date) { query += ` AND a.attendance_date = ?`; params.push(date); }

      query += ` ORDER BY a.attendance_date DESC, a.session ASC`;

      const [rows] = await pool.query(query, params);
      records = rows;
    } catch (err) {
      console.error('Error fetching attendance reports from MySQL:', err);
    }
  }

  if (records.length === 0) {
    records = mockStore.attendance.filter(a => {
      if (department && a.department !== department) return false;
      if (year && a.year !== year) return false;
      if (classSection && a.class_section !== classSection) return false;
      if (subject && a.subject !== subject) return false;
      if (date && a.attendance_date !== date) return false;
      return true;
    }).map(a => {
      const std = mockStore.students.find(s => s.id === a.student_id);
      return {
        ...a,
        student_name: std ? std.name : 'Student',
        parent_mobile: std ? std.parent_mobile : 'N/A'
      };
    });
  }

  return res.json({ success: true, reports: records });
};

/**
 * Fetch SMS parent notification logs for Central Department auditing
 */
export const getSmsLogs = async (req, res) => {
  let logs = [];

  if (isUsingMySQL && pool) {
    try {
      const [rows] = await pool.query(`SELECT * FROM sms_logs ORDER BY sent_at DESC LIMIT 50`);
      logs = rows;
    } catch (err) {
      console.error('Error fetching SMS logs from MySQL:', err);
    }
  }

  if (logs.length === 0) {
    logs = mockStore.sms_logs;
  }

  return res.json({ success: true, logs });
};

/**
 * Head manually sends SMS to parent of a specific absent student
 */
export const headSendSMS = async (req, res) => {
  const { studentId, registerNumber, studentName, parentMobile, date, session, department, classSection } = req.body;

  if (!parentMobile || !studentName) {
    return res.status(400).json({ success: false, message: 'Student and parent details required.' });
  }

  try {
    const smsRes = await sendParentAbsenceSMS({
      studentName,
      registerNumber,
      parentMobile,
      date,
      session,
      department,
      classSection
    });

    // Log it in mock store
    mockStore.sms_logs.push({
      id: mockStore.sms_logs.length + 1,
      student_name: studentName,
      register_number: registerNumber,
      parent_mobile: parentMobile,
      session,
      attendance_date: date,
      message: `Dear Parent, your ward ${studentName} (${registerNumber}) was ABSENT during ${session} session on ${date} in ${classSection}. - ${department}`,
      status: 'Sent by Head',
      sent_at: new Date().toISOString()
    });

    return res.json({ success: true, message: `SMS sent to ${parentMobile} for ${studentName}.` });
  } catch (err) {
    console.error('Error sending Head SMS:', err);
    return res.status(500).json({ success: false, message: 'Failed to send SMS.' });
  }
};
