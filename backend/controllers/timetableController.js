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
