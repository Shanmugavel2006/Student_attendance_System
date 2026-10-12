import pool, { isUsingMySQL, mockStore } from '../config/db.js';
import { sendParentAbsenceSMS } from '../config/sms.js';

/**
 * Submit or update attendance for a class session
 * Automatically calculates period-wise attendance for 7 periods per day (Morning: 4, Afternoon: 3)
 */
export const submitAttendance = async (req, res) => {
  const { department, year, classSection, subject, date, session, records } = req.body;
  const markedBy = req.user.id;

  if (!department || !year || !classSection || !subject || !date || !session || !records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'Invalid payload for attendance submission.' });
  }

  // Determine period count based on session (Morning: 4 periods, Afternoon: 3 periods = 7 total per day)
  const periodCount = session === 'Morning' ? 4 : 3;
  const smsDispatches = [];

  if (isUsingMySQL && pool) {
    try {
      for (const record of records) {
        const presentPeriods = record.status === 'Present' ? periodCount : 0;
        const absentPeriods = record.status === 'Absent' ? periodCount : 0;

        // Upsert / Save attendance with period-wise counts
        await pool.query(
          `INSERT INTO attendance (student_id, register_number, department, year, class_section, subject, attendance_date, session, status, marked_by, periods, present_periods, absent_periods)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), periods = VALUES(periods), present_periods = VALUES(present_periods), absent_periods = VALUES(absent_periods)`,
          [record.studentId, record.registerNumber, department, year, classSection, subject, date, session, record.status, markedBy, periodCount, presentPeriods, absentPeriods]
        );

        // Send parent SMS if marked Absent
        if (record.status === 'Absent') {
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
        message: `Attendance submitted successfully for ${records.length} students (${session} session - ${periodCount} periods)!`,
        smsSentCount: smsDispatches.length
      });
    } catch (err) {
      console.error('Error recording attendance in MySQL:', err);
    }
  }

  // Fallback to Mock Store
  records.forEach(rec => {
    const presentPeriods = rec.status === 'Present' ? periodCount : 0;
    const absentPeriods = rec.status === 'Absent' ? periodCount : 0;

    // Prevent duplicate entries for same student, date, session, subject
    const existingIndex = mockStore.attendance.findIndex(
      a => a.student_id === rec.studentId && a.attendance_date === date && a.session === session && a.subject === subject
    );

    if (existingIndex !== -1) {
      mockStore.attendance[existingIndex].status = rec.status;
      mockStore.attendance[existingIndex].periods = periodCount;
      mockStore.attendance[existingIndex].present_periods = presentPeriods;
      mockStore.attendance[existingIndex].absent_periods = absentPeriods;
      mockStore.attendance[existingIndex].marked_by = markedBy;
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
        marked_by: markedBy,
        periods: periodCount,
        present_periods: presentPeriods,
        absent_periods: absentPeriods
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
    message: `Attendance submitted successfully for ${records.length} students (${session} session - ${periodCount} periods)!`,
    smsSentCount: smsDispatches.length
  });
};

/**
 * Fetch attendance for currently logged-in student (Read-only for students)
 * Calculates period-wise daily and monthly attendance stats
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
    student = mockStore.students.find(
      s => s.user_id === userId ||
        (req.user.email && s.email?.toLowerCase() === req.user.email.toLowerCase()) ||
        (req.user.register_number && s.register_number === req.user.register_number)
    );
    if (!student) {
      student = {
        id: 0,
        user_id: userId,
        register_number: req.user.register_number || '',
        name: req.user.name || '',
        department: req.user.department || '',
        year: req.user.year || '',
        class_section: req.user.class_section || '',
        parent_name: '',
        parent_mobile: '',
        email: req.user.email || ''
      };
    }
    records = mockStore.attendance.filter(
      a => a.student_id === student.id || (student.register_number && a.register_number === student.register_number)
    );
  }

  // Attach period-wise counts to each record
  let totalScheduledPeriods = 0;
  let totalPresentPeriods = 0;
  let totalAbsentPeriods = 0;

  const processedRecords = records.map(r => {
    const periodCount = r.periods || (r.session === 'Morning' ? 4 : 3);
    const presentPeriods = r.present_periods !== undefined ? r.present_periods : (r.status === 'Present' ? periodCount : 0);
    const absentPeriods = r.absent_periods !== undefined ? r.absent_periods : (r.status === 'Absent' ? periodCount : 0);

    totalScheduledPeriods += periodCount;
    totalPresentPeriods += presentPeriods;
    totalAbsentPeriods += absentPeriods;

    return {
      ...r,
      periods: periodCount,
      present_periods: presentPeriods,
      absent_periods: absentPeriods
    };
  });

  const percentage = totalScheduledPeriods > 0 
    ? ((totalPresentPeriods / totalScheduledPeriods) * 100).toFixed(2) 
    : '100.00';

  return res.json({
    success: true,
    student,
    summary: {
      totalClasses: processedRecords.length,
      totalScheduledPeriods,
      presentPeriods: totalPresentPeriods,
      absentPeriods: totalAbsentPeriods,
      percentage: Number(percentage)
    },
    history: processedRecords
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
