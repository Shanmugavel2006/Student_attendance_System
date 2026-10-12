import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, UserCheck, ShieldCheck, ArrowRight, CheckCircle2,
  Award, Clock, Smartphone, Building2, Mail, Key, Lock, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';

const DEPARTMENTS = [
  {
    id: 'cse',
    name: 'Computer Science & Engineering',
    short: 'CSE',
    email: 'cse@college.edu',
    color: 'blue',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'it',
    name: 'Information Technology',
    short: 'IT',
    email: 'it@college.edu',
    color: 'emerald',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'ece',
    name: 'Electronics & Communication',
    short: 'ECE',
    email: 'ece@college.edu',
    color: 'purple',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    short: 'MECH',
    email: 'mech@college.edu',
    color: 'orange',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Load stored department auth state if present
  const [selectedDept, setSelectedDept] = useState(() => {
    const saved = localStorage.getItem('active_department');
    return saved ? JSON.parse(saved) : null;
  });

  const [deptAuthenticated, setDeptAuthenticated] = useState(() => {
    return localStorage.getItem('dept_authenticated') === 'true';
  });

  // Dept Login Form State
  const [deptId, setDeptId] = useState(selectedDept?.id || 'cse');
  const [deptEmail, setDeptEmail] = useState('');
  const [deptPassword, setDeptPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync default email when department selection changes
  const handleDeptSelectChange = (e) => {
    const dId = e.target.value;
    setDeptId(dId);
    const found = DEPARTMENTS.find(d => d.id === dId);
    if (found) setDeptEmail(found.email);
  };

  useEffect(() => {
    if (!deptEmail) {
      const found = DEPARTMENTS.find(d => d.id === deptId);
      if (found) setDeptEmail(found.email);
    }
  }, [deptId]);

  const handleDeptLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!deptEmail || !deptPassword) {
      setError('Department email and password are required.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const deptObj = DEPARTMENTS.find(d => d.id === deptId) || DEPARTMENTS[0];
      
      // Save authenticated department
      localStorage.setItem('active_department', JSON.stringify(deptObj));
      localStorage.setItem('dept_authenticated', 'true');
      
      setSelectedDept(deptObj);
      setDeptAuthenticated(true);
      setLoading(false);
    }, 400);
  };

  const handleSwitchDept = () => {
    localStorage.removeItem('dept_authenticated');
    setDeptAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Campus Image Layer with White Mask */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-35 pointer-events-none"
        style={{ backgroundImage: `url('/images/campus_hero_bg.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-blue-50/60 to-white/80 pointer-events-none"></div>

      {/* Dynamic Color Accent Circles */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 py-5 px-6 max-w-7xl mx-auto w-full flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-600 to-red-600 flex items-center justify-center font-black text-white text-xl shadow-md">
            A
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Attendance<span className="text-blue-600">Pro</span>
            </span>
            <p className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Institutional Portal</p>
          </div>
        </div>

        {deptAuthenticated && selectedDept ? (
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${selectedDept.badge}`}>
              <Building2 className="w-3.5 h-3.5" />
              <span>Dept: {selectedDept.name} ({selectedDept.short})</span>
            </div>
            <button
              onClick={handleSwitchDept}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-full transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Change Department
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>🎓 Digital Campus Management System</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">

        {!deptAuthenticated ? (
          /* ========================================================= */
          /* STEP 1: DEPARTMENT SELECTION + DEPT EMAIL + DEPT PASSWORD  */
          /* ========================================================= */
          <div className="w-full max-w-md my-6 text-left">
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4 shadow-sm">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Step 1 — Department Authentication</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Department Login
              </h1>
              <p className="text-slate-500 text-xs mt-2">
                Choose your department and enter department credentials to unlock role access.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200 relative overflow-hidden">
              
              {error && (
                <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleDeptLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    1. Select Department
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <select
                      value={deptId}
                      onChange={handleDeptSelectChange}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none transition shadow-sm"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.short})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    2. Department Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. cse@college.edu"
                      value={deptEmail}
                      onChange={(e) => setDeptEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    3. Department Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={deptPassword}
                      onChange={(e) => setDeptPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Authenticate Department & Proceed'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STEP 2: ROLE PORTAL LANDING PAGE (IMAGE DISPLAYED BY USER) */
          /* ========================================================= */
          <>
            {/* Active Department Badge Header */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6 shadow-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Active Department: {selectedDept?.name} ({selectedDept?.short})</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mb-6">
              Smart, Transparent & Efficient <br />
              <span className="gradient-text-hero">Student Attendance System</span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg max-w-2xl mb-12 leading-relaxed">
              Streamlining institutional attendance with instant parent SMS dispatch, multi-role portal access, real-time timetable tracking, and departmental auditing.
            </p>

            {/* 3 Role Portals Grid: White Cards with Blue, Green, Red accents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl text-left mb-16">

              {/* 1. Student Portal (BLUE THEME) */}
              <Link
                to="/login/student"
                className="group relative bg-white/70 backdrop-blur-md border-2 border-blue-100 hover:border-blue-500 rounded-3xl p-8 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Background Image Accent */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-[0.04] group-hover:opacity-[0.08] transition duration-300 pointer-events-none"
                  style={{ backgroundImage: `url('/images/student_bg.png')` }}
                ></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Student
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    Student Login
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Access your personal attendance percentage breakdown, daily timetable, subject stats, and upcoming exam schedules.
                  </p>

                  <div className="space-y-2 mb-8 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>Percentage breakdown per subject</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>Session schedule & exam timetable</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between font-bold text-xs text-blue-600 group-hover:text-blue-700">
                  <span>Sign In to Student Portal</span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* 2. Staff Portal (GREEN THEME) */}
              <Link
                to="/login/staff"
                className="group relative bg-white/70 backdrop-blur-md border-2 border-emerald-100 hover:border-emerald-500 rounded-3xl p-8 shadow-xl shadow-emerald-900/5 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Background Image Accent */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-[0.04] group-hover:opacity-[0.08] transition duration-300 pointer-events-none"
                  style={{ backgroundImage: `url('/images/staff_bg.png')` }}
                ></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-300">
                      <UserCheck className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Faculty
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    Staff Login
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Select assigned class & session, mark morning/afternoon attendance within active time windows, and trigger instant SMS alerts.
                  </p>

                  <div className="space-y-2 mb-8 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>Quick morning / afternoon entry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>Automated parent SMS dispatch</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between font-bold text-xs text-emerald-600 group-hover:text-emerald-700">
                  <span>Sign In to Staff Portal</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* 3. Central Dept / Head Portal (RED THEME) */}
              <Link
                to="/login/head"
                className="group relative bg-white/70 backdrop-blur-md border-2 border-rose-100 hover:border-red-500 rounded-3xl p-8 shadow-xl shadow-red-900/5 hover:shadow-2xl hover:shadow-red-500/15 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Background Image Accent */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-[0.04] group-hover:opacity-[0.08] transition duration-300 pointer-events-none"
                  style={{ backgroundImage: `url('/images/head_bg.png')` }}
                ></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-300">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                      Head Dept
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-red-600 transition-colors">
                    Head / Central Dept
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Centralized multi-department monitoring, daily report generation, staff compliance audits, and parent SMS log oversight.
                  </p>

                  <div className="space-y-2 mb-8 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      <span>Institutional monitoring dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      <span>SMS dispatch audit & analytics</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between font-bold text-xs text-red-600 group-hover:text-red-700">
                  <span>Sign In to Head Portal</span>
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

            </div>

            {/* Trust Feature Bar */}
            <div className="w-full max-w-5xl bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Blue Portal</h4>
                  <p className="text-xs text-slate-500">Transparent student stats & schedules</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Green Portal</h4>
                  <p className="text-xs text-slate-500">Time-windowed faculty marking</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Red Portal</h4>
                  <p className="text-xs text-slate-500">Central departmental SMS audit</p>
                </div>
              </div>
            </div>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 bg-white border-t border-slate-200">
        © 2026 Student Attendance Management System • Built with React, Node.js & MySQL
      </footer>
    </div>
  );
}
