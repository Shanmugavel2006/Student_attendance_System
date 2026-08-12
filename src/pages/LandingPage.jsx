import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UserCheck, ShieldCheck, ArrowRight, CheckCircle2, Award, Clock, Smartphone } from 'lucide-react';

export default function LandingPage() {
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

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-slate-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>🎓 Digital Campus Management System</span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Trust Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>Automated Parent SMS Alerts & Real-Time Campus Analytics</span>
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

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 bg-white border-t border-slate-200">
        © 2026 Student Attendance Management System • Built with React, Node.js & MySQL
      </footer>
    </div>
  );
}

