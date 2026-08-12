import pool, { isUsingMySQL, mockStore } from '../config/db.js';

/**
 * Get all staff users — Head only
 */
export const getAllStaff = async (req, res) => {
  if (isUsingMySQL && pool) {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, email, role, department, year, class_section, created_at
         FROM users WHERE role = 'staff' ORDER BY department, name ASC`
      );
      return res.json({ success: true, staff: rows });
    } catch (err) {
      console.error('Error fetching staff from MySQL:', err);
    }
  }

  // Mock fallback
  const staffList = mockStore.users.filter(u => u.role === 'staff').map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    department: u.department, year: u.year, class_section: u.class_section
  }));
  return res.json({ success: true, staff: staffList });
};

/**
 * Add a new staff member — Head enrolls with email & password
 */
export const addStaff = async (req, res) => {
  const { name, email, password, department, year, classSection } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({ success: false, message: 'Name, email, password and department are required.' });
  }

  if (isUsingMySQL && pool) {
    try {
      // Check if email already exists
      const [existing] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      }

      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, department, year, class_section)
         VALUES (?, ?, ?, 'staff', ?, ?, ?)`,
        [name, email, password, department, year || '', classSection || '']
      );

      return res.status(201).json({
        success: true,
        message: `Staff member "${name}" enrolled successfully with login credentials!`,
        staff: {
          id: result.insertId, name, email, role: 'staff',
          department, year: year || '', class_section: classSection || ''
        }
      });
    } catch (err) {
      console.error('Error adding staff in MySQL:', err);
      return res.status(500).json({ success: false, message: 'Failed to add staff. ' + err.message });
    }
  }

  // Mock fallback
  const exists = mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
  }

  const newId = mockStore.users.length + 1;
  const newStaff = {
    id: newId, name, email, password,
    role: 'staff', department, year: year || '', class_section: classSection || ''
  };
  mockStore.users.push(newStaff);

  return res.status(201).json({
    success: true,
    message: `Staff member "${name}" enrolled successfully!`,
    staff: { id: newId, name, email, role: 'staff', department, year: year || '', class_section: classSection || '' }
  });
};

/**
 * Update staff details & optionally reset password — Head only
 */
export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, department, year, classSection } = req.body;

  if (isUsingMySQL && pool) {
    try {
      if (password) {
        await pool.query(
          `UPDATE users SET name = ?, email = ?, password = ?, department = ?, year = ?, class_section = ?
           WHERE id = ? AND role = 'staff'`,
          [name, email, password, department, year || '', classSection || '', id]
        );
      } else {
        await pool.query(
          `UPDATE users SET name = ?, email = ?, department = ?, year = ?, class_section = ?
           WHERE id = ? AND role = 'staff'`,
          [name, email, department, year || '', classSection || '', id]
        );
      }
      return res.json({ success: true, message: `Staff "${name}" updated successfully!` });
    } catch (err) {
      console.error('Error updating staff in MySQL:', err);
      return res.status(500).json({ success: false, message: 'Failed to update staff. ' + err.message });
    }
  }

  // Mock fallback
  const idx = mockStore.users.findIndex(u => u.id === parseInt(id, 10) && u.role === 'staff');
  if (idx !== -1) {
    mockStore.users[idx].name = name || mockStore.users[idx].name;
    mockStore.users[idx].email = email || mockStore.users[idx].email;
    mockStore.users[idx].department = department || mockStore.users[idx].department;
    mockStore.users[idx].year = year || mockStore.users[idx].year;
    mockStore.users[idx].class_section = classSection || mockStore.users[idx].class_section;
    if (password) mockStore.users[idx].password = password;
    return res.json({ success: true, message: `Staff "${name}" updated successfully!` });
  }

  return res.status(404).json({ success: false, message: 'Staff member not found.' });
};

/**
 * Delete a staff member — Head only
 */
export const deleteStaff = async (req, res) => {
  const { id } = req.params;

  if (isUsingMySQL && pool) {
    try {
      await pool.query(`DELETE FROM users WHERE id = ? AND role = 'staff'`, [id]);
      return res.json({ success: true, message: 'Staff member removed successfully.' });
    } catch (err) {
      console.error('Error deleting staff in MySQL:', err);
      return res.status(500).json({ success: false, message: 'Failed to remove staff.' });
    }
  }

  const idx = mockStore.users.findIndex(u => u.id === parseInt(id, 10) && u.role === 'staff');
  if (idx !== -1) {
    mockStore.users.splice(idx, 1);
    return res.json({ success: true, message: 'Staff member removed successfully.' });
  }

  return res.status(404).json({ success: false, message: 'Staff member not found.' });
};
