import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PieChart as PieChartIcon, Calendar, Clock, FileText, Download,
  CheckCircle2, XCircle, AlertTriangle, Filter, Check, X
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import jsPDF from 'jspdf';

// 7 Standard Timetable Periods
const TIMETABLE_PERIODS = [
  { id: 1, name: 'Period 1', time: '09:00 - 10:00 AM' },
  { id: 2, name: 'Period 2', time: '10:00 - 11:00 AM' },
  { id: 3, name: 'Period 3', time: '11:00 - 12:00 PM' },
  { id: 4, name: 'Period 4', time: '12:00 - 01:00 PM' },
  { id: 5, name: 'Period 5', time: '01:50 - 02:30 PM' },
  { id: 6, name: 'Period 6', time: '02:30 - 03:20 PM' },
  { id: 7, name: 'Period 7', time: '03:20 - 04:10 PM' }
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overallStats'); // overallStats, monthlyCalendar, timetable, exam
  const [loading, setLoading] = useState(true);

  // Default selected month automatically defaults to the current month YYYY-MM
  const getCurrentMonthValue = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [attendanceData, setAttendanceData] = useState({
    summary: { totalClasses: 0, totalScheduledPeriods: 0, presentPeriods: 0, absentPeriods: 0, percentage: 100 },
    history: []
  });
  const [timetables, setTimetables] = useState([]);
  const [examTimetables, setExamTimetables] = useState([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [attRes, ttRes, etRes] = await Promise.all([
        api.get('/attendance/student-records'),
        api.get(`/timetables/class?department=${encodeURIComponent(user?.department || '')}&year=${encodeURIComponent(user?.year || '')}&classSection=${encodeURIComponent(user?.class_section || '')}`),
        api.get(`/timetables/exam?department=${encodeURIComponent(user?.department || '')}&year=${encodeURIComponent(user?.year || '')}&classSection=${encodeURIComponent(user?.class_section || '')}`)
      ]);

      if (attRes.data.success) {
        setAttendanceData({
          summary: attRes.data.summary,
          history: attRes.data.history || []
        });
      }
      if (ttRes.data.success) {
        setTimetables(ttRes.data.timetables || []);
      }
      if (etRes.data.success) {
        setExamTimetables(etRes.data.examTimetables || []);
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate Month options starting from January 2026 up to current date (Requirement 5)
  const monthOptions = useMemo(() => {
    const options = [];
    const startYear = 2026;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const endYear = Math.max(2026, currentYear);

    for (let y = startYear; y <= endYear; y++) {
      const maxM = (y === currentYear) ? Math.max(currentMonth, 10) : 12;
      for (let m = 1; m <= maxM; m++) {
        const val = `${y}-${m.toString().padStart(2, '0')}`;
        const d = new Date(y, m - 1, 1);
        const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        options.push({ value: val, label });
      }
    }
    options.push({ value: 'ALL', label: 'All Months' });
    return options;
  }, []);

  // Filter history records by selected month
  const filteredHistory = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'ALL') {
      return attendanceData.history;
    }
    return attendanceData.history.filter(h => h.attendance_date?.startsWith(selectedMonth));
  }, [attendanceData.history, selectedMonth]);

  // Calculate monthly overall period-wise attendance stats (Requirement 4)
  const monthSummary = useMemo(() => {
    let totalScheduledPeriods = 0;
    let presentPeriods = 0;
    let absentPeriods = 0;

    filteredHistory.forEach(r => {
      const pCount = r.periods || (r.session === 'Morning' ? 4 : 3);
      const pres = r.present_periods !== undefined ? r.present_periods : (r.status === 'Present' ? pCount : 0);
      const abs = r.absent_periods !== undefined ? r.absent_periods : (r.status === 'Absent' ? pCount : 0);

      totalScheduledPeriods += pCount;
      presentPeriods += pres;
      absentPeriods += abs;
    });

    const percentage = totalScheduledPeriods > 0 
      ? ((presentPeriods / totalScheduledPeriods) * 100).toFixed(2) 
      : '100.00';

    return {
      sessionCount: filteredHistory.length,
      totalScheduledPeriods,
      presentPeriods,
      absentPeriods,
      percentage
    };
  }, [filteredHistory]);

  // Calculate Daily Period-Wise Attendance Log (Requirement 3)
  const dayWiseAttendance = useMemo(() => {
    const grouped = {};
    filteredHistory.forEach(rec => {
      const d = rec.attendance_date;
      if (!grouped[d]) {
        grouped[d] = {
          date: d,
          scheduledPeriods: 0,
          presentPeriods: 0,
          absentPeriods: 0,
          sessions: []
        };
      }
      const pCount = rec.periods || (rec.session === 'Morning' ? 4 : 3);
      const pres = rec.present_periods !== undefined ? rec.present_periods : (rec.status === 'Present' ? pCount : 0);
      const abs = rec.absent_periods !== undefined ? rec.absent_periods : (rec.status === 'Absent' ? pCount : 0);

      grouped[d].scheduledPeriods += pCount;
      grouped[d].presentPeriods += pres;
      grouped[d].absentPeriods += abs;
      grouped[d].sessions.push(rec);
    });

    return Object.values(grouped).map(day => {
      const percentage = day.scheduledPeriods > 0
        ? ((day.presentPeriods / day.scheduledPeriods) * 100).toFixed(2)
        : '100.00';

      return {
        ...day,
        percentage
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredHistory]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  // PDF Export for Weekly Class Timetable
  const exportTimetablePDF = () => {
    const doc = new jsPDF('landscape');

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL WEEKLY CLASS TIMETABLE', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70);
    doc.text(`Student: ${user?.name || ''} (${user?.register_number || ''}) | Department: ${user?.department || ''} | Class Section: ${user?.class_section || ''}`, 14, 32);

    let startY = 40;
    const colWidthDay = 30;
    const colWidthPeriod = 33;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, startY, colWidthDay + 7 * colWidthPeriod, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Day / Period', 18, startY + 6.5);

    TIMETABLE_PERIODS.forEach((p, pIdx) => {
      doc.setFontSize(7);
      doc.text(`P${pIdx + 1}: ${p.time}`, 14 + colWidthDay + pIdx * colWidthPeriod + 2, startY + 6.5);
    });

    let currentY = startY + 10;
    WEEK_DAYS.forEach((day, dIdx) => {
      const rowHeight = 18;
      if (dIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, colWidthDay + 7 * colWidthPeriod, rowHeight, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(day, 18, currentY + 10);

      const dayItems = timetables.filter(t => t.day_of_week?.toLowerCase() === day.toLowerCase());

      TIMETABLE_PERIODS.forEach((p, pIdx) => {
        const match = dayItems.find(t => t.session_time === p.time) || dayItems[pIdx];
        const x = 14 + colWidthDay + pIdx * colWidthPeriod;

        doc.setDrawColor(226, 232, 240);
        doc.rect(x, currentY, colWidthPeriod, rowHeight);

        if (match) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          const sub = match.subject.length > 18 ? match.subject.substring(0, 16) + '..' : match.subject;
          doc.text(sub, x + 2, currentY + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`Fac: ${match.faculty_name || 'N/A'}`, x + 2, currentY + 11);
          doc.text(`Room: ${match.room || '301'}`, x + 2, currentY + 15);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text('Free Period', x + 4, currentY + 10);
        }
      });

      currentY += rowHeight;
    });

    doc.save(`Weekly_Timetable_${user?.register_number || 'Student'}.pdf`);
  };

  // PDF Export for Semester Exam Schedule
  const exportExamSchedulePDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(219, 39, 119); // Pink-600
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('SEMESTER EXAMINATION SCHEDULE', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70);
    doc.text(`Student: ${user?.name || ''} (${user?.register_number || ''})`, 14, 32);
    doc.text(`Department: ${user?.department || ''} | Semester: Semester 5`, 14, 38);

    let startY = 46;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, startY, 182, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Exam Date', 18, startY + 6.5);
    doc.text('Subject', 55, startY + 6.5);
    doc.text('Exam Time', 115, startY + 6.5);
    doc.text('Semester', 155, startY + 6.5);
    doc.text('Hall', 180, startY + 6.5);

    let currentY = startY + 10;
    examTimetables.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, 10, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text(item.exam_date || '', 18, currentY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.subject || '', 55, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.exam_time || '', 115, currentY + 6.5);
      doc.text(item.semester || 'Semester 5', 155, currentY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(219, 39, 119);
      doc.text(item.exam_hall || 'Main Hall', 180, currentY + 6.5);

      currentY += 10;
    });

    doc.save(`Exam_Schedule_${user?.register_number || 'Student'}.pdf`);
  };

  const pieData = [
    { name: 'Present Periods', value: monthSummary.presentPeriods, color: '#10b981' },
    { name: 'Absent Periods', value: monthSummary.absentPeriods, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">

        {/* Student Profile Banner & Month Filter (Image 1 Style) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h2>
                {user?.register_number && (
                  <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                    Reg: {user?.register_number}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {user?.department} • {user?.year} • Class Section: <span className="text-slate-800 font-bold">{user?.class_section}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Month Selector Filter (Jan 2026 to Current Month) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <Filter className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border-0 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Attendance Rate Card for Selected Month (Requirement 4) */}
            <div className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-right shadow-md">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance Rate</div>
              <div className={`text-2xl font-black ${Number(monthSummary.percentage) >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {monthSummary.percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
          <button
            onClick={() => setActiveTab('overallStats')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'overallStats'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <PieChartIcon className="w-4 h-4" /> Overall Attendance & Stats
          </button>

          <button
            onClick={() => setActiveTab('monthlyCalendar')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'monthlyCalendar'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Monthly Calendar
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Class Timetable
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'exam'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Exam Schedule
          </button>
        </div>

        {/* TAB 1: OVERALL ATTENDANCE & STATS (Requirements 3 & 4) */}
        {activeTab === 'overallStats' && (
          <div className="space-y-6">
            {/* Quick Period Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Scheduled Periods</div>
                <div className="text-3xl font-black text-slate-900">{monthSummary.totalScheduledPeriods}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">7 periods per full day</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-emerald-600 font-bold mb-1 uppercase tracking-wider">Periods Attended</div>
                <div className="text-3xl font-black text-emerald-600 flex items-center gap-2">
                  {monthSummary.presentPeriods} <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Total present periods</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-rose-600 font-bold mb-1 uppercase tracking-wider">Periods Absent</div>
                <div className="text-3xl font-black text-rose-600 flex items-center gap-2">
                  {monthSummary.absentPeriods} <XCircle className="w-6 h-6" />
                </div>
                <div className="text-[11px] text-rose-600/80 font-medium mt-1">Total absent periods</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">Overall Rate</div>
                <div className="text-3xl font-black text-blue-600">{monthSummary.percentage}%</div>
                <div className="text-[11px] text-blue-600/80 font-medium mt-1">Across all subjects</div>
              </div>
            </div>

            {/* Attendance Chart & Daily Period Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ratio Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-blue-600" /> Overall Period Attendance Ratio
                </h3>
                <div className="w-full h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-6 text-xs mt-2 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="text-slate-700">Present ({monthSummary.presentPeriods} Periods)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="text-slate-700">Absent ({monthSummary.absentPeriods} Periods)</span>
                  </div>
                </div>
              </div>

              {/* Daily Period-Wise Attendance Log Table (Requirement 3) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Daily Overall Period Log
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">7 Periods per day</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">Date</th>
                        <th className="p-3.5">Scheduled Periods</th>
                        <th className="p-3.5">Present Periods</th>
                        <th className="p-3.5">Absent Periods</th>
                        <th className="p-3.5">Daily Rate</th>
                        <th className="p-3.5 rounded-r-xl">Overall Day Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {dayWiseAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                            No attendance records found for this period.
                          </td>
                        </tr>
                      ) : (
                        dayWiseAttendance.map((day) => {
                          const isFullPresent = day.absentPeriods === 0 && day.presentPeriods > 0;
                          const isFullAbsent = day.presentPeriods === 0 && day.absentPeriods > 0;
                          return (
                            <tr key={day.date} className="hover:bg-slate-50 transition">
                              <td className="p-3.5 font-bold text-slate-900 font-mono">{formatDateDisplay(day.date)}</td>
                              <td className="p-3.5 font-bold text-slate-800">{day.scheduledPeriods} Periods</td>
                              <td className="p-3.5 text-emerald-600 font-extrabold">{day.presentPeriods}</td>
                              <td className="p-3.5 text-rose-600 font-extrabold">{day.absentPeriods}</td>
                              <td className="p-3.5 font-black text-blue-600">{day.percentage}%</td>
                              <td className="p-3.5">
                                {isFullPresent && (
                                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Present
                                  </span>
                                )}
                                {isFullAbsent && (
                                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Full Absent
                                  </span>
                                )}
                                {!isFullPresent && !isFullAbsent && (
                                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Partial ({day.presentPeriods}/{day.scheduledPeriods})
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY CALENDAR (Requirement 4 & 5) */}
        {activeTab === 'monthlyCalendar' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" /> Monthly Attendance Calendar
                </h3>
                <p className="text-xs text-slate-500">View period-wise attendance status for each day of the month</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Select Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  {monthOptions.filter(m => m.value !== 'ALL').map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar Grid View (31 days) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = (i + 1).toString().padStart(2, '0');
                const monthStr = (selectedMonth === 'ALL' || !selectedMonth) ? getCurrentMonthValue() : selectedMonth;
                const fullDate = `${monthStr}-${dayNum}`;

                const dayObj = dayWiseAttendance.find(d => d.date === fullDate);

                let cardBg = 'bg-slate-50 border-slate-200 text-slate-400';
                let badgeText = 'NO CLASS';
                let badgeStyle = 'bg-slate-200 text-slate-600';

                if (dayObj) {
                  if (dayObj.absentPeriods > 0 && dayObj.presentPeriods === 0) {
                    cardBg = 'bg-red-50 border-red-200 text-red-900';
                    badgeText = 'ABSENT';
                    badgeStyle = 'bg-red-600 text-white font-bold';
                  } else if (dayObj.absentPeriods > 0 && dayObj.presentPeriods > 0) {
                    cardBg = 'bg-amber-50 border-amber-200 text-amber-900';
                    badgeText = `PARTIAL (${dayObj.presentPeriods}/${dayObj.scheduledPeriods})`;
                    badgeStyle = 'bg-amber-500 text-white font-bold';
                  } else if (dayObj.presentPeriods > 0) {
                    cardBg = 'bg-emerald-50 border-emerald-200 text-emerald-900';
                    badgeText = 'PRESENT';
                    badgeStyle = 'bg-emerald-600 text-white font-bold';
                  }
                }

                return (
                  <div key={fullDate} className={`p-4 rounded-2xl border ${cardBg} flex flex-col justify-between h-28 shadow-xs hover:shadow-md transition`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold opacity-70">Day {i + 1}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-xl font-black">{dayNum}</div>

                    <div className="text-[10px] opacity-80 truncate font-medium">
                      {dayObj ? `${dayObj.presentPeriods}/${dayObj.scheduledPeriods} Periods` : 'No records'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 inline-block"></span>
                <span>Present Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-red-600 inline-block"></span>
                <span>Absent Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500 inline-block"></span>
                <span>Partial Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-300 inline-block"></span>
                <span>No Session / Holiday</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEEKLY CLASS TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" /> Weekly Class Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Class: <strong className="text-slate-800">{user?.class_section || 'CSE-A'}</strong> • Department: <strong className="text-slate-800">{user?.department || 'Computer Science & Engineering'}</strong>
                </p>
              </div>

              <button
                onClick={exportTimetablePDF}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download Timetable PDF
              </button>
            </div>

            {/* 7 Periods in single row for each day */}
            <div className="space-y-4">
              {WEEK_DAYS.map((day) => {
                const dayItems = timetables.filter(t => t.day_of_week?.toLowerCase() === day.toLowerCase());

                return (
                  <div key={day} className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-3.5 py-1 rounded-full border border-blue-200">
                        {day}
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold">7 Periods Layout</span>
                    </div>

                    {/* Single Horizontal Row of 7 Periods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {TIMETABLE_PERIODS.map((period, pIdx) => {
                        const item = dayItems.find(t => t.session_time === period.time) || dayItems[pIdx];

                        return (
                          <div key={period.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between min-h-[115px]">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase">{period.name}</span>
                                <span className="text-[9px] bg-blue-50 text-blue-700 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                  {period.time.split(' ')[0]}
                                </span>
                              </div>

                              {item ? (
                                <h5 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">{item.subject}</h5>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400 italic">Self Study</span>
                              )}
                            </div>

                            {item ? (
                              <div className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="truncate max-w-[70px] font-bold text-slate-700">{item.faculty_name}</span>
                                <span className="text-blue-600 font-extrabold">{item.room || '301'}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-300 font-bold pt-2 border-t border-slate-100">
                                Lab / Free
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SEMESTER EXAM SCHEDULE */}
        {activeTab === 'exam' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-pink-600" /> Semester Examination Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Department: <strong className="text-slate-800">{user?.department || 'Computer Science & Engineering'}</strong> • Semester 5
                </p>
              </div>

              <button
                onClick={exportExamSchedulePDF}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-pink-600/20 transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download Exam Schedule PDF
              </button>
            </div>

            {/* Exam Schedule Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Exam Date</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Exam Time</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4">Examination Hall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {examTimetables.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 font-bold">
                        No upcoming examination schedule records available.
                      </td>
                    </tr>
                  ) : (
                    examTimetables.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-blue-600 font-mono">{exam.exam_date}</td>
                        <td className="p-4 font-black text-slate-900">{exam.subject}</td>
                        <td className="p-4 font-mono font-bold text-slate-700">{exam.exam_time}</td>
                        <td className="p-4 font-bold text-slate-600">{exam.semester || 'Semester 5'}</td>
                        <td className="p-4 text-pink-600 font-extrabold">{exam.exam_hall || 'Main Exam Hall A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
