import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Clock, Shield } from 'lucide-react';

export default function Header() {
  const { user, logout, demoBypassTime, toggleDemoBypassTime } = useAuth();

  // Role-based color schemes
  const roleColor = {
    student: { accent: 'blue', logo: 'from-blue-600 to-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200', role: 'text-blue-600' },
    staff: { accent: 'emerald', logo: 'from-emerald-600 to-green-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', role: 'text-emerald-600' },
    head: { accent: 'red', logo: 'from-red-600 to-rose-700', badge: 'bg-red-50 text-red-700 border-red-200', role: 'text-red-600' },
  };
  const rc = roleColor[user?.role] || roleColor.student;

  // Calculate current session & active time window status
  const getWindowStatus = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const mStart = 9 * 60, mEnd = 10 * 60;
    const aStart = 13 * 60 + 50, aEnd = 14 * 60 + 30;

    if (currentMins >= mStart && currentMins <= mEnd) {
      return { active: true, name: 'Morning Session Active (9:00 - 10:00 AM)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    }
    if (currentMins >= aStart && currentMins <= aEnd) {
      return { active: true, name: 'Afternoon Session Active (1:50 - 2:30 PM)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    }
    return { active: false, name: 'Outside Attendance Windows', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  };

  const status = getWindowStatus();

  return (
    <header className="bg-white sticky top-0 z-40 px-6 py-3 border-b border-slate-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${rc.logo} flex items-center justify-center text-white font-bold text-xl shadow-md`}>
          A
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-slate-900">
            Student <span className={rc.role}>Attendance</span> Management System
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Digital Campus Portal
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Time Window Status Badge */}
        {user?.role !== 'student' && (
          <div className={`hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{status.name}</span>
          </div>
        )}

        {/* Demo Time Override Switch — staff/head only */}
        {user && user.role !== 'student' && (
          <label className={`hidden lg:flex items-center gap-2 cursor-pointer text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 transition`}>
            <input
              type="checkbox"
              checked={demoBypassTime}
              onChange={(e) => toggleDemoBypassTime(e.target.checked)}
              className="cursor-pointer"
            />
            <span className="font-medium">Test Time Bypass</span>
            {demoBypassTime ? (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">ON</span>
            ) : (
              <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">OFF</span>
            )}
          </label>
        )}

        {/* Logged User Info */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-sm text-slate-900">{user.name}</div>
              <div className={`text-xs font-semibold capitalize flex items-center justify-end gap-1 ${rc.role}`}>
                <Shield className="w-3 h-3" />
                {user.role === 'head' ? 'Central Dept / Head' : user.role}
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 transition flex items-center gap-2 text-xs font-bold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
