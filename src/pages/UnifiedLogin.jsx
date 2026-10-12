import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, UserCheck, ShieldCheck, ArrowRight, ArrowLeft,
  AlertCircle, Key, Mail, User, Building2, CheckCircle2
} from 'lucide-react';

const DEPARTMENTS = [
  {
    id: 'cse',
    name: 'Computer Science & Engineering',
    short: 'CSE',
    accent: 'from-blue-500 to-indigo-600',
    light: 'bg-blue-50 border-blue-200 text-blue-700',
    hover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    value: 'Computer Science & Engineering',
  },
  {
    id: 'it',
    name: 'Information Technology',
    short: 'IT',
    accent: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    hover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    value: 'Information Technology',
  },
  {
    id: 'ece',
    name: 'Electronics & Communication',
    short: 'ECE',
    accent: 'from-purple-500 to-violet-600',
    light: 'bg-purple-50 border-purple-200 text-purple-700',
    hover: 'hover:border-purple-500 hover:shadow-purple-500/10',
    value: 'Electronics & Communication',
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    short: 'MECH',
    accent: 'from-orange-500 to-amber-600',
    light: 'bg-orange-50 border-orange-200 text-orange-700',
    hover: 'hover:border-orange-500 hover:shadow-orange-500/10',
    value: 'Mechanical Engineering',
  },
];

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    description: 'View attendance, timetable & subject stats',
    icon: GraduationCap,
    color: 'blue',
    accent: 'bg-blue-600',
    hover: 'hover:border-blue-500',
    btnCls: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
    borderFocus: 'focus:border-blue-600',
  },
  {
    key: 'staff',
    label: 'Staff / Faculty',
    description: 'Mark attendance & manage class records',
    icon: UserCheck,
    color: 'emerald',
    accent: 'bg-emerald-600',
    hover: 'hover:border-emerald-500',
    btnCls: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
    borderFocus: 'focus:border-emerald-600',
  },
  {
    key: 'head',
    label: 'Head of Department',
    description: 'Monitor attendance & send parent SMS alerts',
    icon: ShieldCheck,
    color: 'red',
    accent: 'bg-red-600',
    hover: 'hover:border-red-500',
    btnCls: 'bg-red-600 hover:bg-red-700 shadow-red-600/25',
    borderFocus: 'focus:border-red-600',
  },
];

/* ─── Step 1: Department ─── */
function DeptStep({ onSelect }) {
  return (
    <div className="space-y-6" style={{ animation: 'fadeUp 0.22s ease-out' }}>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold mb-3">
          <Building2 className="w-3 h-3" /> Step 1 of 3 — Department
        </div>
        <h2 className="text-xl font-black text-slate-900">Which Department?</h2>
        <p className="text-slate-500 text-xs mt-1">Your login will be restricted to this department only.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onSelect(dept)}
            className={`group relative flex flex-col items-start p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all duration-200 ${dept.hover} hover:shadow-lg text-left`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dept.accent} flex items-center justify-center text-white font-black text-xs shadow-md mb-3 group-hover:scale-105 transition-transform`}>
              {dept.short}
            </div>
            <span className="font-bold text-slate-800 text-sm leading-snug">{dept.name}</span>
            <ArrowRight className="w-4 h-4 text-slate-300 absolute right-3 bottom-3 group-hover:text-slate-600 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Role ─── */
function RoleStep({ dept, onSelect, onBack }) {
  return (
    <div className="space-y-5" style={{ animation: 'fadeUp 0.22s ease-out' }}>
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="text-center">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full border ${dept.light} mb-3`}>
            {dept.short} · {dept.name}
          </span>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold mb-3 ml-2">
            Step 2 of 3 — Role
          </div>
          <h2 className="text-xl font-black text-slate-900">Who are you?</h2>
          <p className="text-slate-500 text-xs mt-1">Select your role in the <strong>{dept.short}</strong> department.</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.key}
              onClick={() => onSelect(role)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white shadow-sm ${role.hover} hover:shadow-lg transition-all duration-200 text-left group`}
            >
              <div className={`w-11 h-11 rounded-xl ${role.accent} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-black text-slate-900 text-sm">{role.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{role.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 3: Login Form ─── */
function LoginStep({ dept, role, onBack }) {
  const { loginStudent, loginStaff, loginHead } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const Icon = role.icon;
  const isStudent = role.key === 'student';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (role.key === 'student') res = await loginStudent(identifier, password);
      else if (role.key === 'staff') res = await loginStaff(identifier, password);
      else res = await loginHead(identifier, password);

      if (res.success) {
        // Department enforcement for staff and head
        if (role.key !== 'student') {
          const userDept = res.user?.department;
          if (userDept && userDept !== '' && userDept !== dept.value) {
            localStorage.removeItem('attendance_token');
            setError(`Access denied. Your account belongs to "${userDept}", not ${dept.short}. Please select the correct department.`);
            setLoading(false);
            return;
          }
        }
        if (role.key === 'student') navigate('/student/dashboard');
        else if (role.key === 'staff') navigate('/staff/dashboard');
        else navigate('/head/dashboard');
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5" style={{ animation: 'fadeUp 0.22s ease-out' }}>
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl ${role.accent} text-white flex items-center justify-center shadow-lg shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-lg leading-tight">{role.label} Login</div>
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${dept.light}`}>{dept.short} Department</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold">
          Step 3 of 3 — Credentials
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            {isStudent ? 'Register Number / Email' : 'Email Address'}
          </label>
          <div className="relative">
            {isStudent
              ? <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              : <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            }
            <input
              type={isStudent ? 'text' : 'email'}
              required
              placeholder={isStudent ? 'e.g. 2023CSE001 or email' : 'your@college.edu'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-300 ${role.borderFocus} rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm`}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-300 ${role.borderFocus} rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm`}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl ${role.btnCls} text-white font-bold text-sm shadow-lg transition disabled:opacity-50`}
        >
          {loading ? 'Authenticating...' : `Sign In as ${role.label}`}
        </button>
      </form>
    </div>
  );
}

/* ─── Main Component ─── */
export default function UnifiedLogin() {
  const [step, setStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/images/campus_hero_bg.png')` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-blue-50/50 to-white/75 pointer-events-none" />
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 py-4 px-6 flex justify-between items-center border-b border-slate-100 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-600 to-red-500 flex items-center justify-center font-black text-white text-base shadow-md">
            A
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Attendance<span className="text-blue-600">Pro</span>
            </span>
            <p className="text-[9px] tracking-widest uppercase font-bold text-slate-400">Institutional Portal</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Department-Scoped Access
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Hero text */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Smart, Transparent Student Attendance System
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              Department<br />
              <span className="bg-gradient-to-r from-blue-600 via-emerald-500 to-red-500 bg-clip-text text-transparent">
                Secure Login
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-2">Select your department, role, then sign in.</p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-7">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step > s ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' :
                  step === s ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 w-10 rounded-full transition-all ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-lg border border-slate-200 rounded-3xl shadow-2xl shadow-slate-900/8 p-7">
            {step === 1 && (
              <DeptStep onSelect={(dept) => { setSelectedDept(dept); setStep(2); }} />
            )}
            {step === 2 && selectedDept && (
              <RoleStep
                dept={selectedDept}
                onSelect={(role) => { setSelectedRole(role); setStep(3); }}
                onBack={() => { setSelectedDept(null); setStep(1); }}
              />
            )}
            {step === 3 && selectedDept && selectedRole && (
              <LoginStep
                dept={selectedDept}
                role={selectedRole}
                onBack={() => { setSelectedRole(null); setStep(2); }}
              />
            )}
          </div>

        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © 2026 Student Attendance Management System • Built with React, Node.js &amp; MySQL
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
