import pool, { isUsingMySQL, mockStore } from '../config/db.js';

/**
 * Fetch class timetable
 */
export const getClassTimetable = async (req, res) => {
  const { department, year, classSection } = req.query;

  let timetables = [];

  if (isUsingMySQL && pool) {
    try {
      let query = `SELECT * FROM timetables WHERE 1=1`;
      const params = [];
      if (department) {
        query += ` AND department = ?`;
        params.push(department);
      }
      if (year) {
        query += ` AND year = ?`;
        params.push(year);
      }
      if (classSection) {
        query += ` AND class_section = ?`;
        params.push(classSection);
      }

      const [rows] = await pool.query(query, params);
      timetables = rows;
    } catch (err) {
      console.error('Error fetching timetable from MySQL:', err);
    }
  }

  if (timetables.length === 0) {
    timetables = mockStore.timetables.filter(t => {
      if (department && t.department !== department) return false;
      if (year && t.year !== year) return false;
      if (classSection && t.class_section !== classSection) return false;
      return true;
    });
  }

  return res.json({ success: true, timetables });
};

/**
 * Fetch exam timetable
 */
export const getExamTimetable = async (req, res) => {
  const { department, year, classSection } = req.query;

  let examTimetables = [];

  if (isUsingMySQL && pool) {
    try {
      let query = `SELECT * FROM exam_timetables WHERE 1=1`;
      const params = [];
      if (department) {
        query += ` AND department = ?`;
        params.push(department);
      }
      if (year) {
        query += ` AND year = ?`;
        params.push(year);
      }
      if (classSection) {
        query += ` AND class_section = ?`;
        params.push(classSection);
      }

      query += ` ORDER BY exam_date ASC`;

      const [rows] = await pool.query(query, params);
      examTimetables = rows;
    } catch (err) {
      console.error('Error fetching exam timetable from MySQL:', err);
    }
  }

  if (examTimetables.length === 0) {
    examTimetables = mockStore.exam_timetables.filter(et => {
      if (department && et.department !== department) return false;
      if (year && et.year !== year) return false;
      if (classSection && et.class_section !== classSection) return false;
      return true;
    });
  }

  return res.json({ success: true, examTimetables });
};

/**
 * Add Class Timetable Slot
 */
export const addClassTimetable = async (req, res) => {
  const { department, year, classSection, dayOfWeek, sessionTime, subject, facultyName, room } = req.body;
  if (!department || !year || !classSection || !dayOfWeek || !sessionTime || !subject || !facultyName) {
    return res.status(400).json({ success: false, message: 'All timetable details are required.' });
  }

  let newItem = null;
  if (isUsingMySQL && pool) {
    try {
      const [result] = await pool.query(
        `INSERT INTO timetables (department, year, class_section, day_of_week, session_time, subject, faculty_name, room)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [department, year, classSection, dayOfWeek, sessionTime, subject, facultyName, room || '']
      );
      newItem = { id: result.insertId, department, year, class_section: classSection, day_of_week: dayOfWeek, session_time: sessionTime, subject, faculty_name: facultyName, room: room || '' };
    } catch (err) {
      console.error('Error adding timetable slot in MySQL:', err);
    }
  }

  if (!newItem) {
    newItem = {
      id: mockStore.timetables.length + 1,
      department,
      year,
      class_section: classSection,
      day_of_week: dayOfWeek,
      session_time: sessionTime,
      subject,
      faculty_name: facultyName,
      room: room || ''
    };
    mockStore.timetables.push(newItem);
  }

  return res.status(201).json({ success: true, message: 'Timetable entry added successfully!', item: newItem });
};

/**
 * Delete Class Timetable Slot
 */
export const deleteClassTimetable = async (req, res) => {
  const { id } = req.params;
  if (isUsingMySQL && pool) {
    try {
      await pool.query(`DELETE FROM timetables WHERE id = ?`, [id]);
      return res.json({ success: true, message: 'Timetable entry deleted successfully!' });
    } catch (err) {
      console.error('Error deleting timetable slot in MySQL:', err);
    }
  }

  const idx = mockStore.timetables.findIndex(t => t.id === parseInt(id, 10));
  if (idx !== -1) {
    mockStore.timetables.splice(idx, 1);
    return res.json({ success: true, message: 'Timetable entry deleted successfully!' });
  }

  return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
};

/**
 * Add Exam Schedule Entry
 */
export const addExamTimetable = async (req, res) => {
  const { department, year, classSection, examDate, subject, examTime, semester, examHall } = req.body;
  if (!department || !year || !classSection || !examDate || !subject || !examTime) {
    return res.status(400).json({ success: false, message: 'All exam details are required.' });
  }

  let newItem = null;
  if (isUsingMySQL && pool) {
    try {
      const [result] = await pool.query(
        `INSERT INTO exam_timetables (department, year, class_section, exam_date, subject, exam_time, semester, exam_hall)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [department, year, classSection, examDate, subject, examTime, semester || '', examHall || '']
      );
      newItem = { id: result.insertId, department, year, class_section: classSection, exam_date: examDate, subject, exam_time: examTime, semester: semester || '', exam_hall: examHall || '' };
    } catch (err) {
      console.error('Error adding exam schedule in MySQL:', err);
    }
  }

  if (!newItem) {
    newItem = {
      id: mockStore.exam_timetables.length + 1,
      department,
      year,
      class_section: classSection,
      exam_date: examDate,
      subject,
      exam_time: examTime,
      semester: semester || '',
      exam_hall: examHall || ''
    };
    mockStore.exam_timetables.push(newItem);
  }

  return res.status(201).json({ success: true, message: 'Exam schedule entry added successfully!', item: newItem });
};

/**
 * Delete Exam Schedule Entry
 */
export const deleteExamTimetable = async (req, res) => {
  const { id } = req.params;
  if (isUsingMySQL && pool) {
    try {
      await pool.query(`DELETE FROM exam_timetables WHERE id = ?`, [id]);
      return res.json({ success: true, message: 'Exam entry deleted successfully!' });
    } catch (err) {
      console.error('Error deleting exam entry in MySQL:', err);
    }
  }

  const idx = mockStore.exam_timetables.findIndex(et => et.id === parseInt(id, 10));
  if (idx !== -1) {
    mockStore.exam_timetables.splice(idx, 1);
    return res.json({ success: true, message: 'Exam entry deleted successfully!' });
  }

  return res.status(404).json({ success: false, message: 'Exam entry not found.' });
};
