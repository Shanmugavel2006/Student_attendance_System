import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, PieChart as PieChartIcon, FileText, Send, Filter, Download,
  CheckCircle2, XCircle, Users, AlertTriangle, Building, Bell, Info
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

  useEffect(() => {
    fetchHeadStats();
    fetchSmsLogs();
  }, []);

  useEffect(() => { fetchReports(); }, [department, year, classSection, subject, date]);

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

          <div className="flex items-center gap-3">
            {tabBtn('overview', 'Overview & Stats', PieChartIcon)}
            {tabBtn('reports', 'Attendance Reports + Send SMS', FileText)}
            {tabBtn('sms_logs', 'SMS Audit Logs', Send)}
          </div>
        </div>

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

                {/* Go to Reports */}
                <button onClick={() => setActiveTab('reports')}
                  className="mt-4 w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition">
                  <Send className="w-3.5 h-3.5" /> Review & Send SMS to Parents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS + SEND SMS */}
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

        {/* TAB 3: SMS AUDIT LOGS */}
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
    </div>
  );
}
