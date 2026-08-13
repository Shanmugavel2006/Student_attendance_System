import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PieChart as PieChartIcon, Calendar, Clock, BookOpen, FileText, Download,
  CheckCircle2, XCircle, Award, AlertTriangle, ShieldCheck, Filter, ChevronLeft, ChevronRight,
  TrendingUp, Check, X, Minus
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reportMatrix'); // reportMatrix, subjectWise, monthlyCalendar, timetable, exam
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-08'); // YYYY-MM
  const [attendanceData, setAttendanceData] = useState({
    summary: { totalClasses: 0, presentCount: 0, absentCount: 0, percentage: 100 },
    subjectWise: [],
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
          subjectWise: attRes.data.subjectWise,
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

  // Master list of subjects
  const allSubjects = useMemo(() => {
    const defaultSubjects = [
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
      'Software Engineering',
      'Web Technology Lab',
      'Data Mining And Visualisation',
      'Digital Forensics',
      'Cloud Computing'
    ];
    const historySubs = (attendanceData.history || []).map(h => h.subject);
    const ttSubs = timetables.map(t => t.subject);
    const set = new Set([...defaultSubjects, ...historySubs, ...ttSubs]);
    return Array.from(set).filter(Boolean);
  }, [attendanceData.history, timetables]);

  // Filter history by selected month if needed
  const filteredHistory = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'ALL') {
      return attendanceData.history;
    }
    return attendanceData.history.filter(h => h.attendance_date?.startsWith(selectedMonth));
  }, [attendanceData.history, selectedMonth]);

  // Get unique sorted dates from history
  const uniqueDates = useMemo(() => {
    const datesSet = new Set(filteredHistory.map(h => h.attendance_date));
    return Array.from(datesSet).sort();
  }, [filteredHistory]);

  // Matrix lookup: { [subject]: { [date]: 'Present' | 'Absent' | 'Not Taken' } }
  const attendanceMatrix = useMemo(() => {
    const matrix = {};
    allSubjects.forEach(sub => {
      matrix[sub] = {};
      uniqueDates.forEach(date => {
        const records = filteredHistory.filter(h => h.subject === sub && h.attendance_date === date);
        if (records.length === 0) {
          matrix[sub][date] = 'Not Taken';
        } else {
          const hasAbsent = records.some(r => r.status === 'Absent');
          matrix[sub][date] = hasAbsent ? 'Absent' : 'Present';
        }
      });
    });
    return matrix;
  }, [allSubjects, uniqueDates, filteredHistory]);

  // Group history by date for Overall Day Attendance
  const dayWiseAttendance = useMemo(() => {
    const grouped = {};
    filteredHistory.forEach(rec => {
      const d = rec.attendance_date;
      if (!grouped[d]) {
        grouped[d] = { date: d, total: 0, present: 0, absent: 0, records: [] };
      }
      grouped[d].total += 1;
      if (rec.status === 'Present') grouped[d].present += 1;
      else grouped[d].absent += 1;
      grouped[d].records.push(rec);
    });
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredHistory]);

  // Calculate filtered summary
  const monthSummary = useMemo(() => {
    const total = filteredHistory.length;
    const present = filteredHistory.filter(h => h.status === 'Present').length;
    const absent = filteredHistory.filter(h => h.status === 'Absent').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : '100.00';
    
    // Unique working days in filtered view
    const workingDays = uniqueDates.length;
    // Days with at least 1 present
    const presentDays = dayWiseAttendance.filter(d => d.present > 0).length;

    return { total, present, absent, percentage, workingDays, presentDays };
  }, [filteredHistory, uniqueDates, dayWiseAttendance]);

  // Format YYYY-MM-DD to DD-MM-YYYY
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  // PDF Export for Image 2 style Attendance Report
  const exportAttendanceReportPDF = () => {
    const doc = new jsPDF('landscape');

    // Title Banner
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`${user?.name || ''} - ${user?.class_section || ''} Attendance Report`, 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70);
    doc.text(`Register No: ${user?.register_number || ''} | Department: ${user?.department || ''} | Year: ${user?.year || ''}`, 14, 32);

    let startX = 14;
    let startY = 38;
    const colWidthSubject = 65;
    const availableWidth = 269 - colWidthSubject;
    const numDates = Math.max(1, uniqueDates.length);
    const colWidthDate = Math.min(22, availableWidth / numDates);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(startX, startY, colWidthSubject + numDates * colWidthDate, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Subject', startX + 4, startY + 6.5);

    uniqueDates.forEach((d, i) => {
      const dx = startX + colWidthSubject + i * colWidthDate;
      doc.setFontSize(7.5);
      doc.text(formatDateDisplay(d), dx + 2, startY + 6.5);
    });

    let currentY = startY + 10;

    // Table Rows
    allSubjects.forEach((sub, sIdx) => {
      const rowHeight = 8;
      if (sIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, currentY, colWidthSubject + numDates * colWidthDate, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      const subTitle = sub.length > 32 ? sub.substring(0, 30) + '..' : sub;
      doc.text(subTitle, startX + 4, currentY + 5.5);

      uniqueDates.forEach((d, i) => {
        const dx = startX + colWidthSubject + i * colWidthDate;
        const status = attendanceMatrix[sub][d];

        if (status === 'Present') {
          doc.setFillColor(220, 252, 231);
          doc.roundedRect(dx + 1, currentY + 1.5, colWidthDate - 2, 5, 1, 1, 'F');
          doc.setTextColor(22, 101, 52);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('Present', dx + 2, currentY + 5);
        } else if (status === 'Absent') {
          doc.setFillColor(254, 226, 226);
          doc.roundedRect(dx + 1, currentY + 1.5, colWidthDate - 2, 5, 1, 1, 'F');
          doc.setTextColor(153, 27, 27);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('Absent', dx + 2, currentY + 5);
        } else {
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(dx + 1, currentY + 1.5, colWidthDate - 2, 5, 1, 1, 'F');
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Not Taken', dx + 1.5, currentY + 5);
        }
      });

      currentY += rowHeight;
    });

    // Summary Box
    currentY += 6;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(startX, currentY, 269, 25, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 122, 87);
    doc.text('Summary Of Attendance', startX + 6, currentY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Present Days out of Working Days: ${monthSummary.presentDays}/${monthSummary.workingDays}`, startX + 6, currentY + 15);
    doc.text(`Attendance Percentage: ${monthSummary.percentage} %`, startX + 6, currentY + 21);

    doc.save(`${user?.name || 'Student'}_Attendance_Report.pdf`);
  };

  // Export Timetable as PDF
  const exportTimetablePDF = (type) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);

    if (type === 'class') {
      doc.text('OFFICIAL CLASS TIMETABLE', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Student: ${user?.name} (${user?.register_number || ''})`, 14, 28);
      doc.text(`Department: ${user?.department || ''} | Year: ${user?.year || ''} | Class: ${user?.class_section || ''}`, 14, 34);

      let y = 46;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Day / Time', 14, y);
      doc.text('Subject', 70, y);
      doc.text('Faculty', 130, y);
      doc.text('Room', 175, y);
      doc.line(14, y + 2, 195, y + 2);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      timetables.forEach((item) => {
        doc.text(`${item.day_of_week} (${item.session_time})`, 14, y);
        doc.text(item.subject, 70, y);
        doc.text(item.faculty_name, 130, y);
        doc.text(item.room || '', 175, y);
        y += 8;
      });

      doc.save(`Class_Timetable_${user?.register_number || 'Student'}.pdf`);
    } else {
      doc.text('OFFICIAL EXAM TIMETABLE', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Student: ${user?.name} (${user?.register_number || ''})`, 14, 28);
      doc.text(`Department: ${user?.department || ''} | Year: ${user?.year || ''} | Semester 5`, 14, 34);

      let y = 46;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Date', 14, y);
      doc.text('Subject', 50, y);
      doc.text('Exam Timing', 115, y);
      doc.text('Hall', 170, y);
      doc.line(14, y + 2, 195, y + 2);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      examTimetables.forEach((item) => {
        doc.text(item.exam_date, 14, y);
        doc.text(item.subject, 50, y);
        doc.text(item.exam_time, 115, y);
        doc.text(item.exam_hall || '', 170, y);
        y += 8;
      });

      doc.save(`Exam_Timetable_${user?.register_number || 'Student'}.pdf`);
    }
  };

  const pieData = [
    { name: 'Present', value: monthSummary.present, color: '#10b981' },
    { name: 'Absent', value: monthSummary.absent, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">

        {/* Student Profile Info Banner (Clean White Theme) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-2xl -z-10 pointer-events-none"></div>

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
            {/* Month Selector Filter */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <Filter className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border-0 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
                <option value="ALL">All Months</option>
              </select>
            </div>

            {/* Attendance Rate Card */}
            <div className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-right shadow-md">
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
            onClick={() => setActiveTab('reportMatrix')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'reportMatrix'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <FileSpreadsheetIcon className="w-4 h-4" /> Attendance Report (Grid Matrix)
          </button>

          <button
            onClick={() => setActiveTab('subjectWise')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'subjectWise'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Subject-wise & Daily Stats
          </button>

          <button
            onClick={() => setActiveTab('monthlyCalendar')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'monthlyCalendar'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Monthly View
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Class Timetable
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'exam'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Exam Schedule
          </button>
        </div>

        {/* TAB 1: ATTENDANCE REPORT MATRIX (IMAGE 2 STYLE) */}
        {activeTab === 'reportMatrix' && (
          <div className="space-y-6">
            {/* Header Banner matching Image 2 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    {user?.name || ''} {user?.class_section ? `- ${user.class_section}` : ''} Attendance Report
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    Subject-wise attendance matrix by dates ({selectedMonth === 'ALL' ? 'All Months' : selectedMonth})
                  </p>
                </div>

                <button
                  onClick={exportAttendanceReportPDF}
                  className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" /> Export Report PDF
                </button>
              </div>

              {/* Grid Matrix Table */}
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-3 border border-slate-300 min-w-[200px] bg-slate-100">Subject</th>
                      {uniqueDates.map(date => (
                        <th key={date} className="p-2.5 border border-slate-300 text-center min-w-[95px] font-mono text-[11px]">
                          {formatDateDisplay(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSubjects.map((subject, idx) => (
                      <tr key={subject} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-3 font-bold text-blue-600 border border-slate-300">
                          {subject}
                        </td>
                        {uniqueDates.map(date => {
                          const status = attendanceMatrix[subject][date];
                          return (
                            <td key={date} className="p-2 border border-slate-300 text-center">
                              {status === 'Present' && (
                                <span className="inline-block px-3 py-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-500/20 rounded-full border border-emerald-400 shadow-sm">
                                  Present
                                </span>
                              )}
                              {status === 'Absent' && (
                                <span className="inline-block px-3 py-1 text-[11px] font-extrabold text-red-700 bg-red-100 rounded-full border border-red-300">
                                  Absent
                                </span>
                              )}
                              {status === 'Not Taken' && (
                                <span className="inline-block px-3 py-1 text-[11px] font-bold text-rose-700 bg-rose-500/10 rounded-full border border-rose-200">
                                  Not Taken
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Of Attendance Box matching Image 2 */}
              <div className="p-6 bg-emerald-50/80 border-t border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-lg font-black text-emerald-900 tracking-tight">Summary Of Attendance</h4>
                </div>

                <div className="space-y-2 text-sm font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Present Days out of Working Days:</span>
                    <span className="text-slate-900 font-extrabold text-base bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      {monthSummary.presentDays} / {monthSummary.workingDays}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Attendance Percentage:</span>
                    <span className="text-emerald-700 font-black text-lg bg-white px-3 py-0.5 rounded-lg border border-emerald-300 shadow-sm">
                      {monthSummary.percentage} %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBJECT-WISE & DAY-WISE ATTENDANCE */}
        {activeTab === 'subjectWise' && (
          <div className="space-y-6">
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Total Sessions</div>
                <div className="text-3xl font-black text-slate-900">{monthSummary.total}</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-emerald-600 font-bold mb-1 uppercase tracking-wider">Sessions Attended</div>
                <div className="text-3xl font-black text-emerald-600 flex items-center gap-2">
                  {monthSummary.present} <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-rose-600 font-bold mb-1 uppercase tracking-wider">Total Absences</div>
                <div className="text-3xl font-black text-rose-600 flex items-center gap-2">
                  {monthSummary.absent} <XCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">Overall Percentage</div>
                <div className="text-3xl font-black text-blue-600">{monthSummary.percentage}%</div>
              </div>
            </div>

            {/* Charts & Subject Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-blue-600" /> Attendance Ratio
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
                    <span className="text-slate-700">Present ({monthSummary.present})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="text-slate-700">Absent ({monthSummary.absent})</span>
                  </div>
                </div>
              </div>

              {/* Subject Wise Cards Grid */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Subject-wise Performance Breakdown
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attendanceData.subjectWise.map((sub) => (
                    <div key={sub.subject} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-900 truncate max-w-[180px]">{sub.subject}</h4>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          Number(sub.percentage) >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {sub.percentage}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            Number(sub.percentage) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Attended: <strong className="text-emerald-600">{sub.present}</strong></span>
                        <span>Absent: <strong className="text-rose-600">{sub.absent}</strong></span>
                        <span>Total: <strong className="text-slate-700">{sub.total}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Day-wise Attendance Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Day-by-Day Attendance Log
                </h3>
                <span className="text-xs text-slate-500 font-medium">Daily attendance summary</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Date</th>
                      <th className="p-3.5">Total Classes</th>
                      <th className="p-3.5">Present Sessions</th>
                      <th className="p-3.5">Absent Sessions</th>
                      <th className="p-3.5 rounded-r-xl">Overall Day Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {dayWiseAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400 font-medium">
                          No daily records found for selected period.
                        </td>
                      </tr>
                    ) : (
                      dayWiseAttendance.map((day) => {
                        const dayStatus = day.absent === 0 ? 'Full Present' : day.present === 0 ? 'Full Absent' : 'Partial';
                        return (
                          <tr key={day.date} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 font-bold text-slate-900 font-mono">{formatDateDisplay(day.date)}</td>
                            <td className="p-3.5 font-bold">{day.total} Sessions</td>
                            <td className="p-3.5 text-emerald-600 font-bold">{day.present}</td>
                            <td className="p-3.5 text-rose-600 font-bold">{day.absent}</td>
                            <td className="p-3.5">
                              {dayStatus === 'Full Present' && (
                                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                </span>
                              )}
                              {dayStatus === 'Full Absent' && (
                                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Absent
                                </span>
                              )}
                              {dayStatus === 'Partial' && (
                                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Partial ({day.present}/{day.total})
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
        )}

        {/* TAB 3: MONTHLY VIEW / CALENDAR */}
        {activeTab === 'monthlyCalendar' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" /> Monthly Attendance Calendar
                </h3>
                <p className="text-xs text-slate-500">View present and absent status for each day of the month</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Select Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="2026-08">August 2026</option>
                  <option value="2026-07">July 2026</option>
                </select>
              </div>
            </div>

            {/* Calendar Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = (i + 1).toString().padStart(2, '0');
                const monthStr = selectedMonth === 'ALL' ? '2026-08' : selectedMonth;
                const fullDate = `${monthStr}-${dayNum}`;

                const recordsForDay = filteredHistory.filter(h => h.attendance_date === fullDate);
                const hasPresent = recordsForDay.some(h => h.status === 'Present');
                const hasAbsent = recordsForDay.some(h => h.status === 'Absent');

                let cardBg = 'bg-slate-50 border-slate-200 text-slate-400';
                let badgeText = 'No Class';
                let badgeStyle = 'bg-slate-200 text-slate-600';

                if (recordsForDay.length > 0) {
                  if (hasAbsent && !hasPresent) {
                    cardBg = 'bg-red-50 border-red-200 text-red-900';
                    badgeText = 'Absent';
                    badgeStyle = 'bg-red-600 text-white font-bold';
                  } else if (hasAbsent && hasPresent) {
                    cardBg = 'bg-amber-50 border-amber-200 text-amber-900';
                    badgeText = 'Partial';
                    badgeStyle = 'bg-amber-500 text-white font-bold';
                  } else {
                    cardBg = 'bg-emerald-50 border-emerald-200 text-emerald-900';
                    badgeText = 'Present';
                    badgeStyle = 'bg-emerald-600 text-white font-bold';
                  }
                }

                return (
                  <div key={fullDate} className={`p-4 rounded-2xl border ${cardBg} flex flex-col justify-between h-28 shadow-xs`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold opacity-70">Day {i + 1}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-lg font-black">{dayNum}</div>

                    <div className="text-[10px] opacity-80 truncate">
                      {recordsForDay.length > 0 ? `${recordsForDay.length} Session(s)` : 'No records'}
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

        {/* TAB 4: CLASS TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Weekly Class Schedule
                </h3>
                <p className="text-xs text-slate-500">Class: {user?.class_section} • Department: {user?.department}</p>
              </div>

              <button
                onClick={() => exportTimetablePDF('class')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download Timetable PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetables.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-blue-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">{item.day_of_week}</span>
                    <span className="text-[11px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded-md border border-blue-200 font-bold">
                      {item.session_time}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">{item.subject}</h4>
                  <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
                    <span>Faculty: <strong className="text-slate-800">{item.faculty_name}</strong></span>
                    <span className="text-blue-700 font-bold">{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: EXAM SCHEDULE */}
        {activeTab === 'exam' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-600" /> Semester Examination Schedule
                </h3>
                <p className="text-xs text-slate-500">Department: {user?.department} • Semester 5</p>
              </div>

              <button
                onClick={() => exportTimetablePDF('exam')}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download Exam Schedule PDF
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Exam Date</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Exam Time</th>
                    <th className="p-3.5">Semester</th>
                    <th className="p-3.5 rounded-r-xl">Examination Hall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {examTimetables.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-blue-600 font-mono">{exam.exam_date}</td>
                      <td className="p-3.5 font-bold text-slate-900">{exam.subject}</td>
                      <td className="p-3.5 font-mono">{exam.exam_time}</td>
                      <td className="p-3.5">{exam.semester}</td>
                      <td className="p-3.5 text-pink-700 font-bold">{exam.exam_hall || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Icon Helper Component
function FileSpreadsheetIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M10 9h.01" />
    </svg>
  );
}
