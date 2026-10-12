/**
 * Middleware to check attendance submission time windows:
 * - Morning Session: 9:30 AM to 10:30 AM (570 mins to 630 mins)
 * - Afternoon Session: 1:30 PM to 2:30 PM (810 mins to 870 mins)
 */
export const checkAttendanceTimeWindow = (req, res, next) => {
  const { session, isDemoBypass } = req.body;
  const headerBypass = req.headers['x-demo-bypass-time'];

  // Allow bypass for live demo / testing mode if flag set
  if (isDemoBypass || headerBypass === 'true' || headerBypass === true) {
    return next();
  }

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  const morningStart = 9 * 60 + 30;   // 09:30 AM = 570 mins
  const morningEnd = 10 * 60 + 30;    // 10:30 AM = 630 mins
  const afternoonStart = 13 * 60 + 30; // 01:30 PM = 810 mins
  const afternoonEnd = 14 * 60 + 30;   // 02:30 PM = 870 mins

  const isMorningSlot = currentTimeMinutes >= morningStart && currentTimeMinutes <= morningEnd;
  const isAfternoonSlot = currentTimeMinutes >= afternoonStart && currentTimeMinutes <= afternoonEnd;

  if (isMorningSlot || isAfternoonSlot) {
    return next();
  }

  let message = '';
  if (currentTimeMinutes < morningStart) {
    message = 'Attendance is currently closed. The morning attendance session will open at 9:30 AM.';
  } else if (currentTimeMinutes > morningEnd && currentTimeMinutes < afternoonStart) {
    message = 'Attendance is currently closed. The afternoon attendance session will open at 1:30 PM.';
  } else {
    message = "Today's attendance sessions are closed. Attendance will open tomorrow at 9:30 AM.";
  }

  return res.status(403).json({
    success: false,
    timeRestricted: true,
    message
  });
};

/**
 * Helper to get current session status for UI display
 */
export const getAttendanceSlotStatus = () => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  const morningStart = 9 * 60 + 30;
  const morningEnd = 10 * 60 + 30;
  const afternoonStart = 13 * 60 + 30;
  const afternoonEnd = 14 * 60 + 30;

  if (currentTimeMinutes >= morningStart && currentTimeMinutes <= morningEnd) {
    return { isOpen: true, session: 'Morning', timeSlot: '9:30 AM - 10:30 AM', message: 'Morning Attendance Session is Currently OPEN (9:30 AM - 10:30 AM)' };
  }
  if (currentTimeMinutes >= afternoonStart && currentTimeMinutes <= afternoonEnd) {
    return { isOpen: true, session: 'Afternoon', timeSlot: '1:30 PM - 2:30 PM', message: 'Afternoon Attendance Session is Currently OPEN (1:30 PM - 2:30 PM)' };
  }

  let message = '';
  if (currentTimeMinutes < morningStart) {
    message = 'Attendance is currently closed. The morning attendance session will open at 9:30 AM.';
  } else if (currentTimeMinutes > morningEnd && currentTimeMinutes < afternoonStart) {
    message = 'Attendance is currently closed. The afternoon attendance session will open at 1:30 PM.';
  } else {
    message = "Today's attendance sessions are closed. Attendance will open tomorrow at 9:30 AM.";
  }

  return { isOpen: false, session: null, message };
};
