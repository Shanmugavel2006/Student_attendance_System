import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck, UserPlus, Calendar, Clock, CheckCircle2, XCircle,
  AlertCircle, AlertTriangle, FileText, Download, ShieldAlert, Info,
  ArrowRight, LogIn, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function StaffDashboard() {
  const { user, demoBypassTime } = useAuth();

  // ========= PHASE 1: CLASS SELECTION (GATED) =========
  const [classConfirmed, setClassConfirmed] = useState(false);

  // Class & Session Selectors
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [classSection, setClassSection] = useState('CSE-A');
  const [subject, setSubject] = useState('Database Management Systems');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('Morning');

  // ========= PHASE 2: DASHBOARD (after class confirmed) =========
  const [activeTab, setActiveTab] = useState('attendance');

  // Student Attendance List & Status
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeRestrictedError, setTimeRestrictedError] = useState('');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    registerNumber: '', name: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year', classSection: 'CSE-A',
    parentName: '', parentMobile: '', email: ''
  });

  // Timetables
  const [timetables, setTimetables] = useState([]);

  // Only fetch data AFTER class is confirmed
  useEffect(() => {
    if (classConfirmed) {
      fetchClassStudents();
      fetchTimetables();
    }
  }, [classConfirmed]);

  const handleConfirmClass = () => {
    setClassConfirmed(true);
    setActiveTab('attendance');
    setFeedback(null);
  };

  const handleChangeClass = () => {
    setClassConfirmed(false);
    setStudents([]);
    setAttendanceRecords({});
    setTimetables([]);
    setFeedback(null);
    setTimeRestrictedError('');
    setActiveTab('attendance');
  };

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students?department=${encodeURIComponent(department)}&year=${encodeURIComponent(year)}&classSection=${encodeURIComponent(classSection)}`);
      if (res.data.success) {
        setStudents(res.data.students);

        const attRes = await api.get(`/attendance/class-records?department=${encodeURIComponent(department)}&year=${encodeURIComponent(year)}&classSection=${encodeURIComponent(classSection)}&subject=${encodeURIComponent(subject)}&date=${date}&session=${session}`);

        const initialMap = {};
        res.data.students.forEach(s => {
          initialMap[s.id] = 'Not Taken';
        });

        if (attRes.data.success && attRes.data.records.length > 0) {
          attRes.data.records.forEach(r => {
            initialMap[r.student_id] = r.status;
          });
        }
        setAttendanceRecords(initialMap);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetables = async () => {
    try {
      const res = await api.get(`/timetables/class?department=${encodeURIComponent(department)}&year=${encodeURIComponent(year)}&classSection=${encodeURIComponent(classSection)}`);
      if (res.data.success) setTimetables(res.data.timetables);
    } catch (err) {
      console.error('Error fetching timetables:', err);
    }
  };

  const handleStatusToggle = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach(s => { updated[s.id] = 'Present'; });
    setAttendanceRecords(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    students.forEach(s => { updated[s.id] = 'Absent'; });
    setAttendanceRecords(updated);
  };

  const handleSubmitAttendance = async () => {
    const unmarked = students.filter(s => !attendanceRecords[s.id] || attendanceRecords[s.id] === 'Not Taken');
    if (unmarked.length > 0) {
      setFeedback({
        type: 'warning',
        message: `Please mark attendance for all ${unmarked.length} unmarked student(s) before submitting.`
      });
      return;
    }

    setFeedback(null);
    setTimeRestrictedError('');
    setSubmitting(true);

    const payloadRecords = students.map(s => ({
      studentId: s.id,
      registerNumber: s.register_number,
      status: attendanceRecords[s.id] || 'Absent'
    }));

    try {
      const res = await api.post('/attendance/submit', {
        department, year, classSection, subject, date, session,
        isDemoBypass: demoBypassTime,
        records: payloadRecords
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `✅ Attendance saved successfully for ${classSection} — ${subject} (${session}). The Head Department will review and send SMS alerts to parents of absent students.`
        });
      }
    } catch (err) {
      if (err.response?.data?.timeRestricted) {
        setTimeRestrictedError(err.response.data.message);
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Failed to submit attendance.'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', newStudent);
      if (res.data.success) {
        setShowAddModal(false);
        setNewStudent({
          registerNumber: '', name: '',
          department: 'Computer Science & Engineering',
          year: '3rd Year', classSection: 'CSE-A',
          parentName: '', parentMobile: '', email: ''
        });
        fetchClassStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add student');
    }
  };

  const downloadTimetablePDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CLASS TIMETABLE', 14, 20);
    doc.setFontSize(10);
    doc.text(`Department: ${department} | Year: ${year} | Section: ${classSection}`, 14, 28);
    let y = 40;
    doc.text('Day / Time', 14, y); doc.text('Subject', 70, y); doc.text('Faculty', 130, y);
    doc.line(14, y + 2, 195, y + 2);
    y += 8;
    doc.setFont('helvetica', 'normal');
    timetables.forEach((item) => {
      doc.text(`${item.day_of_week} (${item.session_time})`, 14, y);
      doc.text(item.subject, 70, y);
      doc.text(item.faculty_name, 130, y);
      y += 8;
    });
    doc.save(`Timetable_${department}_${classSection}.pdf`);
  };

  const presentCount = students.filter(s => attendanceRecords[s.id] === 'Present').length;
  const absentCount = students.filter(s => attendanceRecords[s.id] === 'Absent').length;
  const notTakenCount = students.filter(s => !attendanceRecords[s.id] || attendanceRecords[s.id] === 'Not Taken').length;

  // Short department label for display
  const deptShort = department.includes('Computer') ? 'CSE' : department.includes('Information') ? 'IT' : department.includes('Electronics') ? 'ECE' : 'ME';

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
        activeTab === key
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  // =============================================
  // PHASE 1 — CLASS SELECTION GATE (Home Page)
  // =============================================
  if (!classConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header />

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">

            {/* Welcome Card */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/25">
                <UserCheck className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome, <span className="text-emerald-700">{user?.name}</span>
              </h1>
              <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                Select your class details below to begin. Once confirmed, you'll be able to mark attendance, manage students, and view the class timetable.
              </p>
            </div>

            {/* Class Selection Form */}
            <div className="bg-white border-2 border-emerald-100 shadow-xl shadow-emerald-900/5 rounded-3xl p-8 space-y-6">

              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-black flex items-center justify-center shadow-md">1</span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Select Your Class & Session</h2>
                  <p className="text-xs text-slate-500">Choose department, year, section, subject, date and session to proceed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none transition text-sm">
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Information Technology">Information Technology (IT)</option>
                    <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">Year</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none transition text-sm">
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">Class / Section</label>
                  <select value={classSection} onChange={(e) => setClassSection(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none transition text-sm">
                    <option value="CSE-A">CSE-A</option>
                    <option value="CSE-B">CSE-B</option>
                    <option value="CSE-C">CSE-C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none transition text-sm">
                    <option value="Database Management Systems">Database Management Systems</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Web Technology Lab">Web Technology Lab</option>
                    <option value="Computer Networks">Computer Networks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none transition text-sm" />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">Session</label>
                  <select value={session} onChange={(e) => setSession(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none transition text-sm">
                    <option value="Morning">Morning (9:00 - 10:00 AM)</option>
                    <option value="Afternoon">Afternoon (1:50 - 2:30 PM)</option>
                  </select>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmClass}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/25 transition-all hover:shadow-2xl hover:shadow-emerald-600/30 mt-4"
              >
                <LogIn className="w-5 h-5" />
                Proceed to Class Portal
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-[11px] text-slate-400 mt-2">
                You can change your class selection at any time from within the portal.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =============================================
  // PHASE 2 — FULL DASHBOARD (after confirmed)
  // =============================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="max-w-7xl mx-auto w-full p-6 flex-1 space-y-6">

        {/* Staff Header — shows confirmed class info + change button */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Faculty Class Portal</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-slate-800">{user?.name}</span> •{' '}
                <span className="text-emerald-700 font-bold">{deptShort} → {classSection}</span> •{' '}
                <span className="text-slate-600">{subject}</span> •{' '}
                <span className="text-slate-600">{session} ({date})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Change Class Button */}
            <button onClick={handleChangeClass}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200 transition">
              <RefreshCw className="w-3.5 h-3.5" /> Change Class
            </button>

            {tabBtn('attendance', 'Take Attendance', Calendar)}
            {tabBtn('students', 'Student Management', UserPlus)}
            {tabBtn('timetable', 'Class Timetable', Clock)}
          </div>
        </div>

        {/* TAB 1: ATTENDANCE MARKING */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">

            {/* Time Restriction Alert */}
            {timeRestrictedError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-black block">Attendance Window Closed</span>
                    <span>{timeRestrictedError}</span>
                  </div>
                </div>
                <span className="text-[11px] bg-amber-100 px-3 py-1 rounded-full font-semibold border border-amber-300">
                  Enable "Test Time Bypass" in header to test outside live window.
                </span>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 font-medium ${
                feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                feedback.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                'bg-red-50 border-red-300 text-red-800'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> :
                 feedback.type === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" /> :
                 <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Mark Attendance Table */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">✓</span>
                <h3 className="text-sm font-black text-slate-800">Mark Student Attendance</h3>
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-3 ml-8 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span className="text-slate-500">Not Taken: <span className="text-slate-700">{notTakenCount}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-500">Present: <span className="text-emerald-700">{presentCount}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-500">Absent: <span className="text-red-700">{absentCount}</span></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Class: <span className="font-bold text-slate-700">{classSection}</span> •
                  Total Enrolled: <span className="font-bold text-slate-700">{students.length}</span> Students
                </p>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={markAllPresent}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition">
                    ✓ Mark All Present
                  </button>
                  <button type="button" onClick={markAllAbsent}
                    className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition">
                    ✗ Mark All Absent
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">#</th>
                      <th className="p-3.5">Register No</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Parent Contact</th>
                      <th className="p-3.5 rounded-r-xl text-center">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-8 text-slate-400">Loading student list...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-slate-400">No students enrolled in this class.</td></tr>
                    ) : (
                      students.map((student, idx) => {
                        const status = attendanceRecords[student.id] || 'Not Taken';
                        return (
                          <tr key={student.id} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3.5 font-mono font-black text-emerald-700">{student.register_number}</td>
                            <td className="p-3.5 font-bold text-slate-900">{student.name}</td>
                            <td className="p-3.5 text-slate-500">{student.parent_name} <span className="font-mono">({student.parent_mobile})</span></td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
                                <button type="button" onClick={() => handleStatusToggle(student.id, 'Not Taken')}
                                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition text-xs ${
                                    status === 'Not Taken' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                  }`}>
                                  — Not Taken
                                </button>
                                <button type="button" onClick={() => handleStatusToggle(student.id, 'Present')}
                                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition text-xs ${
                                    status === 'Present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600'
                                  }`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                </button>
                                <button type="button" onClick={() => handleStatusToggle(student.id, 'Absent')}
                                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition text-xs ${
                                    status === 'Absent' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-red-600'
                                  }`}>
                                  <XCircle className="w-3.5 h-3.5" /> Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">▶</span>
                <h3 className="text-sm font-black text-slate-800">Submit Attendance Report</h3>
              </div>

              <div className="ml-8 mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-black block mb-1">📋 How SMS Works</span>
                  <span>After you submit, the attendance report is sent to the <strong>Head Department</strong>. The Head will review absent students and <strong>send SMS alerts to parents</strong>.</span>
                </div>
              </div>

              <div className="ml-8 flex items-center gap-4">
                <button type="button" onClick={handleSubmitAttendance}
                  disabled={submitting || students.length === 0}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50">
                  <FileText className="w-4 h-4" />
                  {submitting ? 'Saving Attendance...' : 'Submit Attendance to Head'}
                </button>
                {notTakenCount > 0 && (
                  <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                    ⚠ {notTakenCount} student(s) not marked yet
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT MANAGEMENT */}
        {activeTab === 'students' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Student Roster — {classSection}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{deptShort} • {year} • {classSection} — {students.length} Students Enrolled</p>
              </div>

              <button type="button" onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto">
                <UserPlus className="w-4 h-4" /> Add New Student
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">#</th>
                    <th className="p-3.5">Register Number</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Parent Name</th>
                    <th className="p-3.5 rounded-r-xl">Parent Mobile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400">No students in this class.</td></tr>
                  ) : (
                    students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3.5 font-mono font-black text-emerald-700">{student.register_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{student.name}</td>
                        <td className="p-3.5 text-slate-500">{student.email}</td>
                        <td className="p-3.5 text-slate-600">{student.parent_name}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">{student.parent_mobile}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TIMETABLE VIEW */}
        {activeTab === 'timetable' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" /> Class Timetable — {classSection}
                </h3>
                <p className="text-xs text-slate-500">{deptShort} • {year} • {classSection}</p>
              </div>

              <button onClick={downloadTimetablePDF}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto">
                <Download className="w-4 h-4" /> Download Timetable PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetables.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400 text-xs">No timetable entries for this class.</div>
              ) : (
                timetables.map((t) => (
                  <div key={t.id} className="bg-slate-50 border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl space-y-2 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{t.day_of_week}</span>
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono">{t.session_time}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{t.subject}</h4>
                    <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
                      <span>Faculty: {t.faculty_name}</span>
                      <span className="text-emerald-600 font-bold">{t.room}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Add New Student to {classSection}</h3>
                <p className="text-xs text-slate-500">Enter student details including parent mobile for SMS.</p>
              </div>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Register Number</label>
                  <input type="text" required placeholder="2023CSE004"
                    value={newStudent.registerNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, registerNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Full Name</label>
                  <input type="text" required placeholder="John Doe"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Student Email</label>
                <input type="email" required placeholder="student@college.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Parent Full Name</label>
                  <input type="text" required placeholder="Robert Doe"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Parent Mobile (SMS)</label>
                  <input type="text" required placeholder="+19876543219"
                    value={newStudent.parentMobile}
                    onChange={(e) => setNewStudent({ ...newStudent, parentMobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25 transition">
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
