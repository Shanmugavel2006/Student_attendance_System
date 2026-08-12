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

      query += ` ORDER BY register_number ASC`;

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, students: rows });
    } catch (err) {
      console.error('Failed to query students from MySQL:', err);
    }
  }

  // Fallback to Mock Store
  let filtered = [...mockStore.students];
  if (department) {
    filtered = filtered.filter(s => s.department === department);
  }
  if (year) {
    filtered = filtered.filter(s => s.year === year);
  }
  if (classSection) {
    filtered = filtered.filter(s => s.class_section === classSection);
  }

  return res.json({ success: true, students: filtered });
};

/**
 * Add a new student to the system with complete details
 */
export const addStudent = async (req, res) => {
  const { registerNumber, name, department, year, classSection, parentName, parentMobile, email } = req.body;

  if (!registerNumber || !name || !department || !year || !classSection || !parentName || !parentMobile || !email) {
    return res.status(400).json({ success: false, message: 'All student details including parent info are required.' });
  }

  let newStudent = null;

  if (isUsingMySQL && pool) {
    try {
      // 1. Create User account first
      const [userResult] = await pool.query(
        `INSERT INTO users (name, email, password, role, department, year, class_section)
         VALUES (?, ?, ?, 'student', ?, ?, ?)`,
        [name, email, '$2a$10$wN9P34j5e5q/y1W5Yy24ueWq2Gf3o8n4v.Qk7X0g3v5v1v2v3v4v5', department, year, classSection]
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
        name,
        department,
        year,
        class_section: classSection,
        parent_name: parentName,
        parent_mobile: parentMobile,
        email
      };
    } catch (err) {
      console.error('Error adding student in MySQL:', err);
    }
  }

  if (!newStudent) {
    // Mock Store insertion
    const mockUserId = mockStore.users.length + 1;
    const mockStudentId = mockStore.students.length + 1;

    mockStore.users.push({
      id: mockUserId,
      name,
      email,
      password: 'student',
      role: 'student',
      department,
      year,
      class_section: classSection
    });

    newStudent = {
      id: mockStudentId,
      user_id: mockUserId,
      register_number: registerNumber,
      name,
      department,
      year,
      class_section: classSection,
      parent_name: parentName,
      parent_mobile: parentMobile,
      email
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
 * Update existing student details
 */
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { registerNumber, name, department, year, classSection, parentName, parentMobile, email } = req.body;

  if (isUsingMySQL && pool) {
    try {
      await pool.query(
        `UPDATE students 
         SET register_number = ?, name = ?, department = ?, year = ?, class_section = ?, parent_name = ?, parent_mobile = ?, email = ?
         WHERE id = ?`,
        [registerNumber, name, department, year, classSection, parentName, parentMobile, email, id]
      );
      return res.json({ success: true, message: 'Student details updated successfully!' });
    } catch (err) {
      console.error('Error updating student in MySQL:', err);
    }
  }

  // Mock Store update
  const studentIndex = mockStore.students.findIndex(s => s.id === parseInt(id, 10));
  if (studentIndex !== -1) {
    mockStore.students[studentIndex] = {
      ...mockStore.students[studentIndex],
      register_number: registerNumber || mockStore.students[studentIndex].register_number,
      name: name || mockStore.students[studentIndex].name,
      department: department || mockStore.students[studentIndex].department,
      year: year || mockStore.students[studentIndex].year,
      class_section: classSection || mockStore.students[studentIndex].class_section,
      parent_name: parentName || mockStore.students[studentIndex].parent_name,
      parent_mobile: parentMobile || mockStore.students[studentIndex].parent_mobile,
      email: email || mockStore.students[studentIndex].email
    };
    return res.json({ success: true, message: 'Student details updated successfully!' });
  }

  return res.status(404).json({ success: false, message: 'Student record not found.' });
};
