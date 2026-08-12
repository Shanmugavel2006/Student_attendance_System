import pool, { isUsingMySQL, mockStore } from '../config/db.js';
import { sendParentAbsenceSMS } from '../config/sms.js';

/**
 * Submit or update attendance for a class session
 */
export const submitAttendance = async (req, res) => {
  const { department, year, classSection, subject, date, session, records } = req.body;
  const markedBy = req.user.id;

  if (!department || !year || !classSection || !subject || !date || !session || !records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'Invalid payload for attendance submission.' });
  }

  const smsDispatches = [];

  if (isUsingMySQL && pool) {
    try {
      for (const record of records) {
        // Upsert / Save attendance
        await pool.query(
          `INSERT INTO attendance (student_id, register_number, department, year, class_section, subject, attendance_date, session, status, marked_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
          [record.studentId, record.registerNumber, department, year, classSection, subject, date, session, record.status, markedBy]
        );

        // If marked Absent, send SMS to Parent
        if (record.status === 'Absent') {
          // Fetch parent phone
          const [stdRows] = await pool.query(`SELECT * FROM students WHERE id = ?`, [record.studentId]);
          if (stdRows.length > 0) {
            const student = stdRows[0];
            const smsRes = await sendParentAbsenceSMS({
              studentName: student.name,
              registerNumber: student.register_number,
              parentMobile: student.parent_mobile,
              date,
              session,
              department,
              classSection
            });
            smsDispatches.push(smsRes);
          }
        }
      }

      return res.json({
        success: true,
        message: `Attendance submitted successfully for ${records.length} students!`,
        smsSentCount: smsDispatches.length
      });
    } catch (err) {
      console.error('Error recording attendance in MySQL:', err);
    }
  }

  // Fallback to Mock Store
  records.forEach(rec => {
    // Remove existing record for same date, session, subject, student
    const existingIndex = mockStore.attendance.findIndex(
      a => a.student_id === rec.studentId && a.attendance_date === date && a.session === session && a.subject === subject
    );

    if (existingIndex !== -1) {
      mockStore.attendance[existingIndex].status = rec.status;
    } else {
      mockStore.attendance.push({
        id: mockStore.attendance.length + 1,
        student_id: rec.studentId,
        register_number: rec.registerNumber,
        department,
        year,
        class_section: classSection,
        subject,
        attendance_date: date,
        session,
        status: rec.status,
        marked_by: markedBy
      });
    }

    if (rec.status === 'Absent') {
      const studentObj = mockStore.students.find(s => s.id === rec.studentId);
      if (studentObj) {
        sendParentAbsenceSMS({
          studentName: studentObj.name,
          registerNumber: studentObj.register_number,
          parentMobile: studentObj.parent_mobile,
          date,
          session,
          department,
          classSection
        });
        smsDispatches.push({ recipient: studentObj.parent_mobile, student: studentObj.name });
      }
    }
  });

  return res.json({
    success: true,
    message: `Attendance submitted successfully for ${records.length} students!`,
    smsSentCount: smsDispatches.length
  });
};

/**
 * Fetch attendance for currently logged-in student
 */
export const getStudentAttendance = async (req, res) => {
  const userId = req.user.id;
  let student = null;
  let records = [];

  if (isUsingMySQL && pool) {
    try {
      const [sRows] = await pool.query(`SELECT * FROM students WHERE user_id = ?`, [userId]);
      if (sRows.length > 0) {
        student = sRows[0];
        const [aRows] = await pool.query(
          `SELECT * FROM attendance WHERE student_id = ? ORDER BY attendance_date DESC`,
          [student.id]
        );
        records = aRows;
      }
    } catch (err) {
      console.error('Error fetching student attendance from MySQL:', err);
    }
  }

  if (!student) {
    student = mockStore.students.find(s => s.user_id === userId) || mockStore.students[0];
    records = mockStore.attendance.filter(a => a.student_id === student.id);
  }

  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 100;

  // Subject-wise summary
  const subjectMap = {};
  records.forEach(r => {
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = { subject: r.subject, total: 0, present: 0, absent: 0 };
    }
    subjectMap[r.subject].total += 1;
    if (r.status === 'Present') subjectMap[r.subject].present += 1;
    else subjectMap[r.subject].absent += 1;
  });

  const subjectWise = Object.values(subjectMap).map(s => ({
    ...s,
    percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : 100
  }));

  return res.json({
    success: true,
    student,
    summary: {
      totalClasses,
      presentCount,
      absentCount,
      percentage: Number(percentage)
    },
    subjectWise,
    history: records
  });
};

/**
 * Fetch class attendance for specific date & session (Staff view)
 */
export const getClassAttendanceRecords = async (req, res) => {
  const { department, year, classSection, subject, date, session } = req.query;

  let records = [];
  if (isUsingMySQL && pool) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM attendance 
         WHERE department = ? AND year = ? AND class_section = ? AND subject = ? AND attendance_date = ? AND session = ?`,
        [department, year, classSection, subject, date, session]
      );
      records = rows;
    } catch (err) {
      console.error('Error fetching class attendance from MySQL:', err);
    }
  } else {
    records = mockStore.attendance.filter(
      a => a.department === department && a.year === year && a.class_section === classSection && a.subject === subject && a.attendance_date === date && a.session === session
    );
  }

  return res.json({ success: true, records });
};
