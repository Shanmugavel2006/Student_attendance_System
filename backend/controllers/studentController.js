import pool, { isUsingMySQL, mockStore } from '../config/db.js';

/**
 * Fetch student list by department, year, and class section
 */
export const getStudentsByClass = async (req, res) => {
  const { department, year, classSection } = req.query;

  if (isUsingMySQL && pool) {
    try {
      let query = `SELECT * FROM students WHERE 1=1`;
      const params = [];

      if (department) { query += ` AND department = ?`; params.push(department); }
      if (year) { query += ` AND year = ?`; params.push(year); }
      if (classSection) { query += ` AND class_section = ?`; params.push(classSection); }

      query += ` ORDER BY register_number ASC`;

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, students: rows });
    } catch (err) {
      console.error('Failed to query students from MySQL:', err);
    }
  }

  // Fallback to Mock Store
  let filtered = [...mockStore.students];
  if (department) filtered = filtered.filter(s => s.department === department);
  if (year) filtered = filtered.filter(s => s.year === year);
  if (classSection) filtered = filtered.filter(s => s.class_section === classSection);

  return res.json({ success: true, students: filtered });
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
      const [sRows] = await pool.query(
        `SELECT * FROM students WHERE user_id = ? OR email = ? OR register_number = ?`,
        [userId, req.user.email || '', req.user.register_number || '']
      );
      if (sRows.length > 0) {
        student = sRows[0];
        const [aRows] = await pool.query(
          `SELECT * FROM attendance WHERE student_id = ? OR register_number = ? ORDER BY attendance_date DESC`,
          [student.id, student.register_number]
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
        s.email?.toLowerCase() === req.user.email?.toLowerCase() ||
        s.register_number === req.user.register_number
    );
    if (!student) {
      student = {
        id: 0,
        user_id: userId,
        register_number: req.user.register_number || 'N/A',
        name: req.user.name || 'Student',
        department: req.user.department || 'N/A',
        year: req.user.year || 'N/A',
        class_section: req.user.class_section || 'N/A',
        parent_name: 'N/A',
        parent_mobile: 'N/A',
        email: req.user.email || 'N/A'
      };
    }
    records = mockStore.attendance.filter(
      a => a.student_id === student.id || a.register_number === student.register_number
    );
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
 * Add a new student to the system with complete details & staff-defined password
 */
export const addStudent = async (req, res) => {
  const { registerNumber, name, department, year, classSection, parentName, parentMobile, email, password } = req.body;

  if (!registerNumber || !name || !department || !year || !classSection || !parentName || !parentMobile || !email) {
    return res.status(400).json({ success: false, message: 'All student details including parent info are required.' });
  }

  const studentPassword = password || 'student123';
  let newStudent = null;

  if (isUsingMySQL && pool) {
    try {
      // Check if email or register number already exists
      const [existing] = await pool.query(
        `SELECT id FROM users WHERE email = ?`, [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'A student with this email already exists.' });
      }

      // 1. Create User account
      const [userResult] = await pool.query(
        `INSERT INTO users (name, email, password, role, department, year, class_section)
         VALUES (?, ?, ?, 'student', ?, ?, ?)`,
        [name, email, studentPassword, department, year, classSection]
      );
      const newUserId = userResult.insertId;

      // 2. Create Student details entry
      const [studentResult] = await pool.query(
        `INSERT INTO students (user_id, register_number, name, department, year, class_section, parent_name, parent_mobile, email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newUserId, registerNumber, name, department, year, classSection, parentName, parentMobile, email]
      );

      newStudent = {
        id: studentResult.insertId,
        user_id: newUserId,
        register_number: registerNumber,
        name, department, year,
        class_section: classSection,
        parent_name: parentName,
        parent_mobile: parentMobile,
        email
      };
    } catch (err) {
      console.error('Error adding student in MySQL:', err);
      return res.status(500).json({ success: false, message: 'Failed to add student. ' + err.message });
    }
  }

  if (!newStudent) {
    // Mock Store insertion
    const mockUserId = mockStore.users.length + 1;
    const mockStudentId = mockStore.students.length + 1;

    mockStore.users.push({
      id: mockUserId, name, email,
      password: studentPassword,
      role: 'student', department, year, class_section: classSection
    });

    newStudent = {
      id: mockStudentId, user_id: mockUserId,
      register_number: registerNumber, name, department, year,
      class_section: classSection, parent_name: parentName,
      parent_mobile: parentMobile, email
    };

    mockStore.students.push(newStudent);
  }

  return res.status(201).json({
    success: true,
    message: 'Student added successfully!',
    student: newStudent
  });
};

/**
 * Update existing student details & optionally reset password
 */
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { registerNumber, name, department, year, classSection, parentName, parentMobile, email, password } = req.body;

  if (isUsingMySQL && pool) {
    try {
      // Fetch user_id for student
      const [sRows] = await pool.query(`SELECT user_id FROM students WHERE id = ?`, [id]);
      if (sRows.length > 0) {
        const userId = sRows[0].user_id;

        // Update student info
        await pool.query(
          `UPDATE students
           SET register_number = ?, name = ?, department = ?, year = ?, class_section = ?, parent_name = ?, parent_mobile = ?, email = ?
           WHERE id = ?`,
          [registerNumber, name, department, year, classSection, parentName, parentMobile, email, id]
        );

        // Update user account
        if (password) {
          await pool.query(
            `UPDATE users SET name = ?, email = ?, password = ?, department = ?, year = ?, class_section = ? WHERE id = ?`,
            [name, email, password, department, year, classSection, userId]
          );
        } else {
          await pool.query(
            `UPDATE users SET name = ?, email = ?, department = ?, year = ?, class_section = ? WHERE id = ?`,
            [name, email, department, year, classSection, userId]
          );
        }

        return res.json({ success: true, message: 'Student details updated successfully!' });
      }
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    } catch (err) {
      console.error('Error updating student in MySQL:', err);
      return res.status(500).json({ success: false, message: 'Failed to update student. ' + err.message });
    }
  }

  // Mock Store update
  const studentIndex = mockStore.students.findIndex(s => s.id === parseInt(id, 10));
  if (studentIndex !== -1) {
    const targetStudent = mockStore.students[studentIndex];
    mockStore.students[studentIndex] = {
      ...targetStudent,
      register_number: registerNumber || targetStudent.register_number,
      name: name || targetStudent.name,
      department: department || targetStudent.department,
      year: year || targetStudent.year,
      class_section: classSection || targetStudent.class_section,
      parent_name: parentName || targetStudent.parent_name,
      parent_mobile: parentMobile || targetStudent.parent_mobile,
      email: email || targetStudent.email
    };

    const userIndex = mockStore.users.findIndex(u => u.id === targetStudent.user_id);
    if (userIndex !== -1) {
      mockStore.users[userIndex].name = name || mockStore.users[userIndex].name;
      mockStore.users[userIndex].email = email || mockStore.users[userIndex].email;
      if (password) mockStore.users[userIndex].password = password;
    }

    return res.json({ success: true, message: 'Student details updated successfully!' });
  }

  return res.status(404).json({ success: false, message: 'Student record not found.' });
};

/**
 * Delete student record
 */
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  if (isUsingMySQL && pool) {
    try {
      await pool.query(`DELETE FROM students WHERE id = ?`, [id]);
      return res.json({ success: true, message: 'Student deleted successfully!' });
    } catch (err) {
      console.error('Error deleting student in MySQL:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete student.' });
    }
  }

  // Mock Store delete
  const index = mockStore.students.findIndex(s => s.id === parseInt(id, 10));
  if (index !== -1) {
    mockStore.students.splice(index, 1);
    return res.json({ success: true, message: 'Student deleted successfully!' });
  }

  return res.status(404).json({ success: false, message: 'Student record not found.' });
};
