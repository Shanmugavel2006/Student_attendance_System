/**
 * Middleware to check attendance submission time windows:
 * - Morning Session: 09:00 AM to 10:00 AM
 * - Afternoon Session: 01:50 PM to 02:30 PM (13:50 to 14:30)
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

  if (session === 'Morning') {
    // 09:00 AM (540 mins) to 10:00 AM (600 mins)
    const morningStart = 9 * 60; // 540
    const morningEnd = 10 * 60;  // 600

    if (currentTimeMinutes < morningStart || currentTimeMinutes > morningEnd) {
      return res.status(403).json({
        success: false,
        timeRestricted: true,
        message: 'Morning attendance can only be taken between 9:00 AM and 10:00 AM.'
      });
    }
  } else if (session === 'Afternoon') {
    // 01:50 PM (13:50 -> 13*60 + 50 = 830 mins) to 02:30 PM (14:30 -> 14*60 + 30 = 870 mins)
    const afternoonStart = 13 * 60 + 50; // 830
    const afternoonEnd = 14 * 60 + 30;  // 870

    if (currentTimeMinutes < afternoonStart || currentTimeMinutes > afternoonEnd) {
      return res.status(403).json({
        success: false,
        timeRestricted: true,
        message: 'Afternoon attendance can only be taken between 1:50 PM and 2:30 PM.'
      });
    }
  }

  next();
};
