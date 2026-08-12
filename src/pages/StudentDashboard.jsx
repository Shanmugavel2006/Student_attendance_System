import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PieChart as PieChartIcon, Calendar, Clock, BookOpen, FileText, Download,
  CheckCircle2, XCircle, Award, AlertTriangle, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, timetable, exam
  const [loading, setLoading] = useState(true);
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
        api.get(`/timetables/class?department=${encodeURIComponent(user?.department || 'Computer Science & Engineering')}&year=${encodeURIComponent(user?.year || '3rd Year')}&classSection=${encodeURIComponent(user?.class_section || 'CSE-A')}`),
        api.get(`/timetables/exam?department=${encodeURIComponent(user?.department || 'Computer Science & Engineering')}&year=${encodeURIComponent(user?.year || '3rd Year')}&classSection=${encodeURIComponent(user?.class_section || 'CSE-A')}`)
      ]);

      if (attRes.data.success) {
        setAttendanceData({
          summary: attRes.data.summary,
          subjectWise: attRes.data.subjectWise,
          history: attRes.data.history
        });
      }
      if (ttRes.data.success) {
        setTimetables(ttRes.data.timetables);
      }
      if (etRes.data.success) {
        setExamTimetables(etRes.data.examTimetables);
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export Timetable as PDF
  const exportTimetablePDF = (type) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);

    if (type === 'class') {
      doc.text('OFFICIAL CLASS TIMETABLE', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Student: ${user?.name} (${user?.register_number || '2023CSE001'})`, 14, 28);
      doc.text(`Department: ${user?.department || 'CSE'} | Year: ${user?.year || '3rd Year'} | Class: ${user?.class_section || 'CSE-A'}`, 14, 34);

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
        doc.text(item.room || 'Lab 1', 175, y);
        y += 8;
      });

      doc.save(`Class_Timetable_${user?.register_number || 'Student'}.pdf`);
    } else {
      doc.text('OFFICIAL EXAM TIMETABLE', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Student: ${user?.name} (${user?.register_number || '2023CSE001'})`, 14, 28);
      doc.text(`Department: ${user?.department || 'CSE'} | Year: ${user?.year || '3rd Year'} | Semester 5`, 14, 34);

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
        doc.text(item.exam_hall || 'Hall A', 170, y);
        y += 8;
      });

      doc.save(`Exam_Timetable_${user?.register_number || 'Student'}.pdf`);
    }
  };

  const pieData = [
    { name: 'Present', value: attendanceData.summary.presentCount, color: '#10b981' },
    { name: 'Absent', value: attendanceData.summary.absentCount, color: '#f43f5e' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto w-full p-6 flex-1 space-y-6">

        {/* Student Profile Info Bar */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold text-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Reg: {user?.register_number || '2023CSE001'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user?.department} • {user?.year} • Class: <span className="text-slate-200 font-semibold">{user?.class_section}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Attendance Rate</div>
              <div className={`text-xl font-black ${attendanceData.summary.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {attendanceData.summary.percentage}%
              </div>
            </div>
            {attendanceData.summary.percentage < 75 && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 max-w-xs">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Attendance below 75% required threshold!</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-900 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PieChartIcon className="w-4 h-4" /> Attendance Statistics
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'timetable'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" /> Class Timetable
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'exam'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Exam Schedule
          </button>
        </div>

        {/* TAB 1: ATTENDANCE STATS & HISTORY */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl border border-slate-800">
                <div className="text-xs text-slate-400 font-medium mb-1">Total Classes Conducted</div>
                <div className="text-3xl font-black text-white">{attendanceData.summary.totalClasses}</div>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-slate-800">
                <div className="text-xs text-emerald-400 font-medium mb-1">Total Sessions Attended</div>
                <div className="text-3xl font-black text-emerald-400 flex items-center gap-2">
                  {attendanceData.summary.presentCount} <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-slate-800">
                <div className="text-xs text-rose-400 font-medium mb-1">Total Absences</div>
                <div className="text-3xl font-black text-rose-400 flex items-center gap-2">
                  {attendanceData.summary.absentCount} <XCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-slate-800">
                <div className="text-xs text-indigo-400 font-medium mb-1">Overall Percentage</div>
                <div className="text-3xl font-black text-indigo-400">{attendanceData.summary.percentage}%</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-white mb-4">Attendance Ratio</h3>
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-6 text-xs mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="text-slate-300">Present ({attendanceData.summary.presentCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="text-slate-300">Absent ({attendanceData.summary.absentCount})</span>
                  </div>
                </div>
              </div>

              {/* Subject Wise Bar Chart */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-4">Subject-wise Attendance (%)</h3>
                <div className="w-full h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData.subjectWise}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                      <Bar dataKey="percentage" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" /> Complete Attendance History
                </h3>
                <span className="text-xs text-slate-400">Read-only student log</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Date</th>
                      <th className="p-3.5">Session</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Class / Section</th>
                      <th className="p-3.5 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {attendanceData.history.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-500">No attendance records found yet.</td>
                      </tr>
                    ) : (
                      attendanceData.history.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-medium text-white">{record.attendance_date}</td>
                          <td className="p-3.5">{record.session}</td>
                          <td className="p-3.5 font-medium">{record.subject}</td>
                          <td className="p-3.5">{record.class_section}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${
                              record.status === 'Present'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {record.status === 'Present' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLASS TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" /> Weekly Class Schedule
                </h3>
                <p className="text-xs text-slate-400">Class: {user?.class_section} • Department: {user?.department}</p>
              </div>

              <button
                onClick={() => exportTimetablePDF('class')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download Timetable PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetables.map((item) => (
                <div key={item.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{item.day_of_week}</span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{item.session_time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.subject}</h4>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-900">
                    <span>Faculty: {item.faculty_name}</span>
                    <span className="text-indigo-300">{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EXAM SCHEDULE */}
        {activeTab === 'exam' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400" /> Semester Examination Schedule
                </h3>
                <p className="text-xs text-slate-400">Department: {user?.department} • Semester 5</p>
              </div>

              <button
                onClick={() => exportTimetablePDF('exam')}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-pink-600/30 transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download Exam Timetable PDF
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Exam Date</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Exam Time</th>
                    <th className="p-3.5">Semester</th>
                    <th className="p-3.5 rounded-r-xl">Examination Hall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {examTimetables.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5 font-bold text-indigo-400">{exam.exam_date}</td>
                      <td className="p-3.5 font-semibold text-white">{exam.subject}</td>
                      <td className="p-3.5 font-mono">{exam.exam_time}</td>
                      <td className="p-3.5">{exam.semester}</td>
                      <td className="p-3.5 text-pink-400 font-medium">{exam.exam_hall || 'Main Hall'}</td>
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
