import pool, { isUsingMySQL, mockStore } from './db.js';

/**
 * Sends SMS notification to parent when a student is marked absent.
 */
export async function sendParentAbsenceSMS({ studentName, registerNumber, parentMobile, date, session, department, classSection }) {
  const message = `Dear Parent, your son/daughter ${studentName} (${registerNumber}) was marked absent today (${session} session, ${date}, ${classSection} - ${department}). Please contact the college for further information.`;

  console.log(`\n📱 [SMS DISPATCHER] Sending SMS to Parent Phone: ${parentMobile}`);
  console.log(`✉️  Message Content: "${message}"\n`);

  const sentAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  if (isUsingMySQL && pool) {
    try {
      await pool.query(
        `INSERT INTO sms_logs (student_name, register_number, parent_mobile, message, attendance_date, session, status)
         VALUES (?, ?, ?, ?, ?, ?, 'SENT')`,
        [studentName, registerNumber, parentMobile, message, date, session]
      );
    } catch (err) {
      console.error('Failed to log SMS to MySQL database:', err);
    }
  } else {
    // In-Memory store logging
    mockStore.sms_logs.unshift({
      id: mockStore.sms_logs.length + 1,
      student_name: studentName,
      register_number: registerNumber,
      parent_mobile: parentMobile,
      message,
      attendance_date: date,
      session,
      status: 'SENT',
      sent_at: sentAt
    });
  }

  return {
    success: true,
    recipient: parentMobile,
    message
  };
}
