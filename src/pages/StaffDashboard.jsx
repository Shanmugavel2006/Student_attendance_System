import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck, UserPlus, Calendar, Clock, CheckCircle2, XCircle,
  AlertCircle, AlertTriangle, FileText, Download, ShieldAlert, Info,
  ArrowRight, LogIn, RefreshCw, Edit, Trash2, Plus, X
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

  // ========= PHASE 2: DASHBOARD TABS =========
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, students, timetable, exam

  // Student Attendance List & Status
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeRestrictedError, setTimeRestrictedError] = useState('');

  // Modals State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [studentForm, setStudentForm] = useState({
    registerNumber: '', name: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year', classSection: 'CSE-A',
    parentName: '', parentMobile: '', email: ''
  });

  // Timetables & Exam Schedules
  const [timetables, setTimetables] = useState([]);
  const [examTimetables, setExamTimetables] = useState([]);

  // Add Timetable Modal State
  const [showAddTtModal, setShowAddTtModal] = useState(false);
  const [newTt, setNewTt] = useState({
    dayOfWeek: 'Monday', sessionTime: '09:00 - 10:00 AM',
    subject: 'Database Management Systems', facultyName: user?.name || 'Prof. A. Kumar', room: 'Lab 1'
  });

  // Add Exam Modal State
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExam, setNewExam] = useState({
    examDate: new Date().toISOString().split('T')[0],
    subject: 'Database Management Systems',
    examTime: '10:00 AM - 01:00 PM',
    semester: 'Semester 5',
    examHall: 'Main Exam Hall A'
  });

  useEffect(() => {
    if (classConfirmed) {
      fetchClassStudents();
      fetchTimetables();
      fetchExamTimetables();
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
    setExamTimetables([]);
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

  const fetchExamTimetables = async () => {
    try {
      const res = await api.get(`/timetables/exam?department=${encodeURIComponent(department)}&year=${encodeURIComponent(year)}&classSection=${encodeURIComponent(classSection)}`);
      if (res.data.success) setExamTimetables(res.data.examTimetables);
    } catch (err) {
      console.error('Error fetching exam timetables:', err);
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

  // Student CRUD
  const openAddStudentModal = () => {
    setStudentForm({
      registerNumber: '', name: '',
      department: department,
      year: year, classSection: classSection,
      parentName: '', parentMobile: '', email: ''
    });
    setShowAddStudentModal(true);
  };

  const openEditStudentModal = (std) => {
    setEditingStudent(std);
    setStudentForm({
      registerNumber: std.register_number,
      name: std.name,
      department: std.department || department,
      year: std.year || year,
      classSection: std.class_section || classSection,
      parentName: std.parent_name || '',
      parentMobile: std.parent_mobile || '',
      email: std.email || ''
    });
    setShowEditStudentModal(true);
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', studentForm);
      if (res.data.success) {
        setShowAddStudentModal(false);
        fetchClassStudents();
        setFeedback({ type: 'success', message: 'New student added successfully!' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await api.put(`/students/${editingStudent.id}`, studentForm);
      if (res.data.success) {
        setShowEditStudentModal(false);
        setEditingStudent(null);
        fetchClassStudents();
        setFeedback({ type: 'success', message: 'Student details updated successfully!' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"?`)) return;
    try {
      const res = await api.delete(`/students/${studentId}`);
      if (res.data.success) {
        fetchClassStudents();
        setFeedback({ type: 'success', message: `Student "${studentName}" removed.` });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  // Timetable CRUD
  const handleAddTimetableSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/timetables/class', {
        department, year, classSection, ...newTt
      });
      if (res.data.success) {
        setShowAddTtModal(false);
        fetchTimetables();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add timetable entry');
    }
  };

  const handleDeleteTimetable = async (ttId) => {
    if (!window.confirm('Are you sure you want to delete this timetable slot?')) return;
    try {
      const res = await api.delete(`/timetables/class/${ttId}`);
      if (res.data.success) fetchTimetables();
    } catch (err) {
      alert('Failed to delete timetable slot');
    }
  };

  // Exam Schedule CRUD
  const handleAddExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/timetables/exam', {
        department, year, classSection, ...newExam
      });
      if (res.data.success) {
        setShowAddExamModal(false);
        fetchExamTimetables();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add exam entry');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam schedule entry?')) return;
    try {
      const res = await api.delete(`/timetables/exam/${examId}`);
      if (res.data.success) fetchExamTimetables();
    } catch (err) {
      alert('Failed to delete exam entry');
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
  // PHASE 1 — CLASS SELECTION GATE
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
                Select your department & class details below to manage attendance, edit student records, and update timetables.
              </p>
            </div>

            {/* Class Selection Form */}
            <div className="bg-white border-2 border-emerald-100 shadow-xl shadow-emerald-900/5 rounded-3xl p-8 space-y-6">

              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-black flex items-center justify-center shadow-md">1</span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Select Department & Class Section</h2>
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
                    <option value="Software Engineering">Software Engineering</option>
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

              {/* Confirm & Quick Edit Buttons */}
              <div className="space-y-3 mt-4">
                <button
                  onClick={handleConfirmClass}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/25 transition-all hover:shadow-2xl hover:shadow-emerald-600/30"
                >
                  <LogIn className="w-5 h-5" />
                  Proceed to Faculty Management Portal
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    handleConfirmClass();
                    setActiveTab('students');
                  }}
                  className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-sm border-2 border-blue-200 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Direct Edit & Manage Student Logins / Passwords
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =============================================
  // PHASE 2 — FULL DASHBOARD
  // =============================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="max-w-7xl mx-auto w-full p-6 flex-1 space-y-6">

        {/* Staff Header — shows confirmed class info + tab options */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Faculty Management Portal</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-slate-800">{user?.name}</span> •{' '}
                <span className="text-emerald-700 font-bold">{deptShort} → {classSection}</span> •{' '}
                <span className="text-slate-600">{subject}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleChangeClass}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200 transition mr-1">
              <RefreshCw className="w-3.5 h-3.5" /> Change Class
            </button>

            {tabBtn('attendance', 'Mark Attendance', Calendar)}
            {tabBtn('students', 'Manage Students', UserPlus)}
            {tabBtn('timetable', 'Class Timetable', Clock)}
            {tabBtn('exam', 'Exam Schedule', FileText)}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">✓</span>
                  <h3 className="text-sm font-black text-slate-800">Mark Student Attendance — {subject} ({session})</h3>
                </div>

                <div className="flex items-center gap-2">
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

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="text-slate-500">Not Taken: <span className="text-slate-800">{notTakenCount}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-emerald-700">Present: <span>{presentCount}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-red-700">Absent: <span>{absentCount}</span></span>
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
                      <th className="p-3.5 text-center">Attendance Status</th>
                      <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading student list...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-400">No students enrolled in this class. Use "Manage Students" tab to add.</td></tr>
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
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => openEditStudentModal(student)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Student Mismatches"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
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

        {/* TAB 2: STUDENT MANAGEMENT (CREATE, EDIT, DELETE) */}
        {activeTab === 'students' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Student Records Management — {classSection}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{deptShort} • {year} • {classSection} — {students.length} Students Enrolled</p>
              </div>

              <button type="button" onClick={openAddStudentModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto">
                <Plus className="w-4 h-4" /> Add New Student
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">#</th>
                    <th className="p-3.5">Register Number</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Department & Class</th>
                    <th className="p-3.5">Parent Contact</th>
                    <th className="p-3.5 rounded-r-xl text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-slate-400">No students found for this department & section. Click "Add New Student" to enroll.</td></tr>
                  ) : (
                    students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3.5 font-mono font-black text-emerald-700">{student.register_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{student.name}</td>
                        <td className="p-3.5 text-slate-500">{student.email}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{student.department} ({student.class_section})</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{student.parent_name} ({student.parent_mobile})</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => openEditStudentModal(student)}
                            className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition inline-flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-bold border border-red-200 transition inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CLASS TIMETABLE MANAGEMENT */}
        {activeTab === 'timetable' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" /> Manage Class Timetable — {classSection}
                </h3>
                <p className="text-xs text-slate-500">{deptShort} • {year} • {classSection}</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setShowAddTtModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition">
                  <Plus className="w-4 h-4" /> Add Timetable Slot
                </button>

                <button onClick={downloadTimetablePDF}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200 transition">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetables.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400 text-xs">No timetable entries for this class. Click "Add Timetable Slot" to create one.</div>
              ) : (
                timetables.map((t) => (
                  <div key={t.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 relative group hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{t.day_of_week}</span>
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono">{t.session_time}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{t.subject}</h4>
                    <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
                      <span>Faculty: {t.faculty_name}</span>
                      <span className="text-emerald-600 font-bold">{t.room}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteTimetable(t.id)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 rounded-md transition opacity-0 group-hover:opacity-100"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EXAM SCHEDULE MANAGEMENT */}
        {activeTab === 'exam' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> Manage Exam Schedule — {classSection}
                </h3>
                <p className="text-xs text-slate-500">{deptShort} • Semester Examination Schedule</p>
              </div>

              <button onClick={() => setShowAddExamModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition">
                <Plus className="w-4 h-4" /> Add Exam Entry
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Exam Date</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Exam Time</th>
                    <th className="p-3.5">Semester</th>
                    <th className="p-3.5">Exam Hall</th>
                    <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {examTimetables.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400">No exam schedule entries created yet. Click "Add Exam Entry" to add one.</td></tr>
                  ) : (
                    examTimetables.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-black text-emerald-700">{exam.exam_date}</td>
                        <td className="p-3.5 font-bold text-slate-900">{exam.subject}</td>
                        <td className="p-3.5 font-mono text-slate-600">{exam.exam_time}</td>
                        <td className="p-3.5 text-slate-600">{exam.semester}</td>
                        <td className="p-3.5 font-bold text-blue-700">{exam.exam_hall || 'Main Hall'}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                            title="Delete Exam Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: ADD NEW STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative">
            <button onClick={() => setShowAddStudentModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Add New Student to {classSection}</h3>
                <p className="text-xs text-slate-500">Create new student record with login credentials.</p>
              </div>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Register Number</label>
                  <input type="text" required placeholder="2023CSE004"
                    value={studentForm.registerNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Full Name</label>
                  <input type="text" required placeholder="Student Name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Student Email</label>
                <input type="email" required placeholder="student@college.edu"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide flex items-center gap-1">🔑 Login Password (Set by Staff — student cannot change this)</label>
                <input type="password" required placeholder="Set a login password for the student"
                  value={studentForm.password || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                <p className="text-[11px] text-slate-400 mt-1">Only staff can set or reset student passwords. Share this with the student directly.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Parent Full Name</label>
                  <input type="text" required placeholder="Parent Name"
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Parent Mobile (SMS)</label>
                  <input type="text" required placeholder="+19876543219"
                    value={studentForm.parentMobile}
                    onChange={(e) => setStudentForm({ ...studentForm, parentMobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition">
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT DETAILS (FIX MISMATCHES) */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative">
            <button onClick={() => setShowEditStudentModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Student Mismatches</h3>
                <p className="text-xs text-slate-500">Fix student credentials, register number, department or parent contact.</p>
              </div>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Register Number</label>
                  <input type="text" required
                    value={studentForm.registerNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Full Name</label>
                  <input type="text" required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Student Email</label>
                <input type="email" required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">🔑 Reset Password (leave blank to keep current)</label>
                <input type="password"
                  placeholder="••••••••  (leave blank to keep current password)"
                  value={studentForm.password || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                <p className="text-[11px] text-slate-400 mt-1">Only staff can set or reset student passwords. Students cannot change their own password.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Parent Full Name</label>
                  <input type="text" required
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Parent Mobile (SMS)</label>
                  <input type="text" required
                    value={studentForm.parentMobile}
                    onChange={(e) => setStudentForm({ ...studentForm, parentMobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TIMETABLE SLOT */}
      {showAddTtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative">
            <button onClick={() => setShowAddTtModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Class Timetable Slot</h3>
                <p className="text-xs text-slate-500">Create schedule entry for {classSection}.</p>
              </div>
            </div>

            <form onSubmit={handleAddTimetableSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Day of Week</label>
                  <select value={newTt.dayOfWeek} onChange={(e) => setNewTt({ ...newTt, dayOfWeek: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium">
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Session Time</label>
                  <input type="text" required placeholder="09:00 - 10:00 AM"
                    value={newTt.sessionTime}
                    onChange={(e) => setNewTt({ ...newTt, sessionTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Subject Name</label>
                <input type="text" required placeholder="e.g. Database Management Systems"
                  value={newTt.subject}
                  onChange={(e) => setNewTt({ ...newTt, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Faculty Name</label>
                  <input type="text" required placeholder="Prof. A. Kumar"
                    value={newTt.facultyName}
                    onChange={(e) => setNewTt({ ...newTt, facultyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Classroom / Lab</label>
                  <input type="text" required placeholder="Lab 1 / Room 302"
                    value={newTt.room}
                    onChange={(e) => setNewTt({ ...newTt, room: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddTtModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition">
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD EXAM ENTRY */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative">
            <button onClick={() => setShowAddExamModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Exam Schedule Entry</h3>
                <p className="text-xs text-slate-500">Create examination timetable entry for students.</p>
              </div>
            </div>

            <form onSubmit={handleAddExamSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Exam Date</label>
                  <input type="date" required
                    value={newExam.examDate}
                    onChange={(e) => setNewExam({ ...newExam, examDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Exam Timing</label>
                  <input type="text" required placeholder="10:00 AM - 01:00 PM"
                    value={newExam.examTime}
                    onChange={(e) => setNewExam({ ...newExam, examTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Subject</label>
                <input type="text" required placeholder="Database Management Systems"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Semester</label>
                  <input type="text" required placeholder="Semester 5"
                    value={newExam.semester}
                    onChange={(e) => setNewExam({ ...newExam, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Examination Hall</label>
                  <input type="text" required placeholder="Main Exam Hall A"
                    value={newExam.examHall}
                    onChange={(e) => setNewExam({ ...newExam, examHall: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition">
                  Save Exam Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
