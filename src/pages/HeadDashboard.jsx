import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, PieChart as PieChartIcon, FileText, Send, Filter, Download,
  CheckCircle2, XCircle, Users, AlertTriangle, Building, Bell, Info,
  UserPlus, Edit, Trash2, KeyRound, X, UserCheck
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import jsPDF from 'jspdf';

export default function HeadDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, totalAttendanceMarked: 0,
    overallPercentage: 88.5, recentAbsents: []
  });

  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [classSection, setClassSection] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [reports, setReports] = useState([]);

  const [smsLogs, setSmsLogs] = useState([]);
  const [smsSending, setSmsSending] = useState({});
  const [smsFeedback, setSmsFeedback] = useState({});

  // Staff Management State
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffFeedback, setStaffFeedback] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '', email: '', password: '', department: 'Computer Science & Engineering',
    year: '3rd Year', classSection: 'CSE-A'
  });

  useEffect(() => {
    fetchHeadStats();
    fetchSmsLogs();
  }, []);

  useEffect(() => { fetchReports(); }, [department, year, classSection, subject, date]);

  useEffect(() => {
    if (activeTab === 'staff') fetchStaffList();
  }, [activeTab]);

  const fetchHeadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard-stats');
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching Head stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (department) params.append('department', department);
      if (year) params.append('year', year);
      if (classSection) params.append('classSection', classSection);
      if (subject) params.append('subject', subject);
      if (date) params.append('date', date);
      const res = await api.get(`/reports/attendance-reports?${params.toString()}`);
      if (res.data.success) setReports(res.data.reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const fetchSmsLogs = async () => {
    try {
      const res = await api.get('/reports/sms-logs');
      if (res.data.success) setSmsLogs(res.data.logs);
    } catch (err) {
      console.error('Error fetching SMS logs:', err);
    }
  };

  const fetchStaffList = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.data.success) setStaffList(res.data.staff);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const resetStaffForm = () => {
    setStaffForm({
      name: '', email: '', password: '',
      department: '',
      year: '', classSection: ''
    });
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffFeedback(null);
    try {
      const res = await api.post('/staff', {
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        department: staffForm.department,
        year: staffForm.year,
        classSection: staffForm.classSection
      });
      if (res.data.success) {
        setShowAddStaffModal(false);
        resetStaffForm();
        fetchStaffList();
        fetchHeadStats();
        setStaffFeedback({ type: 'success', message: res.data.message });
        setTimeout(() => setStaffFeedback(null), 4000);
      }
    } catch (err) {
      setStaffFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to add staff member.' });
    }
  };

  const handleEditStaffOpen = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      password: '',
      department: staff.department || '',
      year: staff.year || '',
      classSection: staff.class_section || ''
    });
    setShowEditStaffModal(true);
  };

  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffFeedback(null);
    try {
      const res = await api.put(`/staff/${editingStaff.id}`, {
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password || undefined,
        department: staffForm.department,
        year: staffForm.year,
        classSection: staffForm.classSection
      });
      if (res.data.success) {
        setShowEditStaffModal(false);
        setEditingStaff(null);
        resetStaffForm();
        fetchStaffList();
        setStaffFeedback({ type: 'success', message: res.data.message });
        setTimeout(() => setStaffFeedback(null), 4000);
      }
    } catch (err) {
      setStaffFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update staff.' });
    }
  };

  const handleDeleteStaff = async (staffMember) => {
    if (!window.confirm(`Remove staff member "${staffMember.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/staff/${staffMember.id}`);
      if (res.data.success) {
        fetchStaffList();
        fetchHeadStats();
        setStaffFeedback({ type: 'success', message: `"${staffMember.name}" removed successfully.` });
        setTimeout(() => setStaffFeedback(null), 4000);
      }
    } catch (err) {
      setStaffFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to remove staff.' });
    }
  };

  // Head manually sends SMS to a parent
  const handleSendSMS = async (record, idx) => {
    setSmsSending(prev => ({ ...prev, [idx]: true }));
    setSmsFeedback(prev => ({ ...prev, [idx]: null }));
    try {
      const res = await api.post('/reports/send-sms', {
        studentId: record.student_id,
        registerNumber: record.register_number,
        studentName: record.student_name,
        parentMobile: record.parent_mobile,
        date: record.attendance_date,
        session: record.session,
        department: record.department,
        classSection: record.class_section
      });
      if (res.data.success) {
        setSmsFeedback(prev => ({ ...prev, [idx]: { type: 'success', msg: `✅ SMS sent to parent of ${record.student_name}` } }));
        fetchSmsLogs();
      }
    } catch (err) {
      setSmsFeedback(prev => ({ ...prev, [idx]: { type: 'error', msg: `Failed to send SMS: ${err.response?.data?.message || 'Error'}` } }));
    } finally {
      setSmsSending(prev => ({ ...prev, [idx]: false }));
    }
  };

  const exportPDFReport = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CENTRAL DEPARTMENT ATTENDANCE AUDIT REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Filter: ${department || 'All Departments'}`, 14, 28);
    let y = 40;
    doc.text('Student Name', 14, y); doc.text('Reg No', 60, y);
    doc.text('Dept / Class', 95, y); doc.text('Session', 150, y); doc.text('Status', 180, y);
    doc.line(14, y + 2, 195, y + 2);
    y += 8;
    doc.setFont('helvetica', 'normal');
    reports.slice(0, 30).forEach((item) => {
      doc.text(item.student_name || 'Student', 14, y);
      doc.text(item.register_number || 'N/A', 60, y);
      doc.text(`${item.class_section} (${item.department?.substring(0, 10)})`, 95, y);
      doc.text(`${item.session} (${item.attendance_date})`, 150, y);
      doc.text(item.status, 180, y);
      y += 7;
    });
    doc.save(`Central_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const deptData = [
    { name: 'CSE', rate: 92 }, { name: 'IT', rate: 88 },
    { name: 'ECE', rate: 85 }, { name: 'ME', rate: 79 }
  ];

  const absentReports = reports.filter(r => r.status === 'Absent');

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
        activeTab === key
          ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
          : 'bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-700'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  const deptOptions = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering'
  ];


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="max-w-7xl mx-auto w-full p-6 flex-1 space-y-6">

        {/* Head Banner */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Central Department Control Center</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutional Monitoring • Signed in as <span className="font-bold text-slate-800">{user?.name}</span>{' '}
                <span className="text-red-600 font-semibold">(Head Dept)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tabBtn('overview', 'Overview & Stats', PieChartIcon)}
            {tabBtn('staff', 'Manage Staff', UserCheck)}
            {tabBtn('reports', 'Attendance Reports', FileText)}
            {tabBtn('sms_logs', 'SMS Audit Logs', Send)}
          </div>
        </div>

        {/* Global Staff Feedback Toast */}
        {staffFeedback && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
            staffFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {staffFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            {staffFeedback.message}
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-3xl">
                <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">Total Enrolled Students</div>
                <div className="text-3xl font-black text-slate-900 flex items-center justify-between">
                  <span>{stats.totalStudents}</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-3xl">
                <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">Active Faculty Staff</div>
                <div className="text-3xl font-black text-emerald-700 flex items-center justify-between">
                  <span>{stats.totalStaff}</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <button onClick={() => setActiveTab('staff')}
                  className="mt-2 text-[11px] text-emerald-700 font-bold hover:underline">
                  → Manage Staff Logins
                </button>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-3xl">
                <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">Sessions Recorded</div>
                <div className="text-3xl font-black text-blue-700 flex items-center justify-between">
                  <span>{stats.totalAttendanceMarked}</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-3xl">
                <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">Institutional Rate</div>
                <div className="text-3xl font-black text-red-600 flex items-center justify-between">
                  <span>{stats.overallPercentage}%</span>
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts + Recent Absents */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm p-6 rounded-3xl">
                <h3 className="text-sm font-black text-slate-900 mb-4">Department Attendance Rate Comparison (%)</h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                      <Bar dataKey="rate" fill="#dc2626" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Absent Alerts */}
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl">
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Recent Absence Alerts
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {stats.recentAbsents.length === 0 ? (
                    <p className="text-xs text-slate-400">No recent absents recorded.</p>
                  ) : (
                    stats.recentAbsents.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs">
                        <div className="flex justify-between font-black">
                          <span className="text-slate-900">{item.student_name}</span>
                          <span className="text-red-600">{item.session}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Reg: {item.register_number} • Class: {item.class_section} ({item.attendance_date})
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button onClick={() => setActiveTab('reports')}
                  className="mt-4 w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition">
                  <Send className="w-3.5 h-3.5" /> Review & Send SMS to Parents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE STAFF */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Staff Info Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-black block mb-1">👮 Head Responsibility — Staff Enrollment</span>
                <span>As Head of Department, only you can <strong>enroll new faculty staff</strong>, <strong>assign email & login passwords</strong>, <strong>update department assignments</strong>, and <strong>remove staff accounts</strong>. Staff members cannot create or change their own passwords.</span>
              </div>
            </div>

            {/* Staff List Header */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Faculty Staff Directory</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {staffList.length} staff member{staffList.length !== 1 ? 's' : ''} enrolled • Only Head can add/edit/remove
                  </p>
                </div>
                <button
                  onClick={() => { resetStaffForm(); setShowAddStaffModal(true); }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-600/20 transition"
                >
                  <UserPlus className="w-4 h-4" /> Enroll New Staff
                </button>
              </div>

              {staffLoading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Loading staff list...</div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-10">
                  <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No staff enrolled yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Enroll New Staff" to add the first faculty member.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">#</th>
                        <th className="p-3.5">Faculty Name</th>
                        <th className="p-3.5">Email / Login ID</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5">Year</th>
                        <th className="p-3.5">Class Section</th>
                        <th className="p-3.5">Enrolled On</th>
                        <th className="p-3.5 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {staffList.map((staff, idx) => (
                        <tr key={staff.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0">
                                {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div>
                                <div className="font-black text-slate-900">{staff.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">ID: {staff.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-mono font-bold text-red-700">{staff.email}</div>
                            <div className="text-[11px] text-slate-400">Role: Staff</div>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                              {staff.department || '—'}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">{staff.year || '—'}</td>
                          <td className="p-3.5">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-black text-[11px]">
                              {staff.class_section || '—'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {staff.created_at
                              ? new Date(staff.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditStaffOpen(staff)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 flex items-center gap-1.5 transition"
                                title="Edit staff details & reset password"
                              >
                                <Edit className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff)}
                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 flex items-center gap-1.5 transition"
                                title="Remove staff member"
                              >
                                <Trash2 className="w-3 h-3" /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS + SEND SMS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">

            {/* How It Works Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <span className="font-black block mb-1">📋 Head Workflow — SMS to Parents</span>
                <span>Staff submits attendance reports. You (Head) review below — filter by class, date, and session. Find absent students and click <strong>"Send SMS to Parent"</strong> to dispatch an SMS notification. All sent SMS will appear in the "SMS Audit Logs" tab.</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-red-500" /> Filter Attendance Reports
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Filter by department, class and date to see submitted attendance from staff.</p>
                </div>

                <button onClick={exportPDFReport}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition self-start sm:self-auto">
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wide">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-medium">
                    <option value="">All Departments</option>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wide">Year</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-medium">
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wide">Class / Section</label>
                  <select value={classSection} onChange={(e) => setClassSection(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-medium">
                    <option value="">All Sections</option>
                    <option value="CSE-A">CSE-A</option>
                    <option value="CSE-B">CSE-B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wide">Subject</label>
                  <input type="text" placeholder="e.g. Database Management"
                    value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wide">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-medium" />
                </div>
              </div>
            </div>

            {/* Absent Students — SMS Panel */}
            {absentReports.length > 0 && (
              <div className="bg-white border border-red-200 shadow-sm p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black text-slate-900">Absent Students — Send SMS to Parents</h3>
                  <span className="ml-2 text-[11px] font-black bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                    {absentReports.length} Absent
                  </span>
                </div>
                <p className="text-xs text-slate-500">Review below and click "Send SMS" for each absent student to notify their parents.</p>

                <div className="space-y-3">
                  {absentReports.map((record, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900 text-sm">{record.student_name}</span>
                          <span className="text-[11px] font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">{record.register_number}</span>
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{record.session}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {record.department} • {record.class_section} • {record.subject} • {record.attendance_date}
                        </div>
                        <div className="text-xs text-slate-600 font-mono">
                          📱 Parent: <strong>{record.parent_mobile}</strong>
                        </div>
                        {smsFeedback[idx] && (
                          <div className={`text-xs font-bold mt-1 ${smsFeedback[idx].type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {smsFeedback[idx].msg}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSendSMS(record, idx)}
                        disabled={smsSending[idx]}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-red-600/20 transition disabled:opacity-50 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {smsSending[idx] ? 'Sending...' : 'Send SMS to Parent'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Reports Table */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl">
              <h3 className="text-sm font-black text-slate-900 mb-4">All Attendance Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Student Name</th>
                      <th className="p-3.5">Register No</th>
                      <th className="p-3.5">Dept & Class</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Date & Session</th>
                      <th className="p-3.5 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reports.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-400">No attendance reports matching criteria.</td></tr>
                    ) : (
                      reports.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-bold text-slate-900">{r.student_name}</td>
                          <td className="p-3.5 font-mono font-black text-red-600">{r.register_number}</td>
                          <td className="p-3.5 text-slate-600">{r.department} ({r.class_section})</td>
                          <td className="p-3.5 font-medium text-slate-700">{r.subject}</td>
                          <td className="p-3.5 text-slate-600">{r.attendance_date} <span className="font-bold">({r.session})</span></td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-black text-[11px] border ${
                              r.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : r.status === 'Absent'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {r.status}
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

        {/* TAB 4: SMS AUDIT LOGS */}
        {activeTab === 'sms_logs' && (
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Parent SMS Dispatch Audit Log</h3>
                <p className="text-xs text-slate-500">Complete history of SMS notifications sent to parents by Head Department.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wide">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Recipient Parent Mobile</th>
                    <th className="p-3.5">Student Name & Reg No</th>
                    <th className="p-3.5">Session / Date</th>
                    <th className="p-3.5">SMS Message</th>
                    <th className="p-3.5 rounded-r-xl">Dispatch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {smsLogs.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-slate-400">No parent SMS logs recorded yet. Go to "Attendance Reports" to send SMS to parents of absent students.</td></tr>
                  ) : (
                    smsLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-black text-red-600">{log.parent_mobile}</td>
                        <td className="p-3.5">
                          <span className="font-black text-slate-900 block">{log.student_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{log.register_number}</span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{log.session} ({log.attendance_date})</td>
                        <td className="p-3.5 text-slate-500 italic max-w-md">"{log.message}"</td>
                        <td className="p-3.5">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                            {log.status}
                          </span>
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

      {/* MODAL: ENROLL NEW STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddStaffModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Enroll New Faculty Staff</h3>
                <p className="text-xs text-slate-500">Head assigns email & password — staff cannot create their own account.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span><strong>Important:</strong> The password you set here is the staff member's login credential. Share it with them directly. Only you (Head) can reset it later.</span>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Full Name</label>
                  <input type="text" required placeholder="Prof. Suresh Kumar"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Email Address</label>
                  <input type="email" required placeholder="staff@college.edu"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Login Password (Set by Head)
                </label>
                <input type="password" required placeholder="Set a secure password for staff login"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-500" />
                <p className="text-[11px] text-slate-400 mt-1">🔒 Only the Head can set or reset staff passwords.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Department</label>
                <select required value={staffForm.department}
                  onChange={(e) => setStaffForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-500">
                  <option value="">— Select Department —</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Assigned Year</label>
                  <select value={staffForm.year}
                    onChange={(e) => setStaffForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-500">
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Class Section</label>
                  <input type="text" placeholder="e.g. CSE-A"
                    value={staffForm.classSection}
                    onChange={(e) => setStaffForm(f => ({ ...f, classSection: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition">
                  Enroll Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF */}
      {showEditStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowEditStaffModal(false); setEditingStaff(null); }} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Staff — {editingStaff?.name}</h3>
                <p className="text-xs text-slate-500">Update staff details or reset their login password.</p>
              </div>
            </div>

            <form onSubmit={handleEditStaffSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Full Name</label>
                  <input type="text" required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Email Address</label>
                  <input type="email" required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> New Password (leave blank to keep current)
                </label>
                <input type="password"
                  placeholder="•••••••• (leave blank to keep current)"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500" />
                <p className="text-[11px] text-slate-400 mt-1">🔒 Only the Head can set or reset staff passwords.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Department</label>
                <select required value={staffForm.department}
                  onChange={(e) => setStaffForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500">
                  <option value="">— Select Department —</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Assigned Year</label>
                  <select value={staffForm.year}
                    onChange={(e) => setStaffForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500">
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Class Section</label>
                  <input type="text" placeholder="e.g. CSE-A"
                    value={staffForm.classSection}
                    onChange={(e) => setStaffForm(f => ({ ...f, classSection: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setShowEditStaffModal(false); setEditingStaff(null); }}
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

    </div>
  );
}
