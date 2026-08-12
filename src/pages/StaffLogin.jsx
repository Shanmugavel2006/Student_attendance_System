import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Key, Mail, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginStaff(email, password);
      if (res.success) {
        navigate('/staff/dashboard');
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('staff@college.edu');
    setPassword('staff');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/images/staff_bg.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-emerald-50/50 to-white/80 pointer-events-none"></div>

      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Role Selection
        </Link>

        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-600/30">
            <UserCheck className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Faculty Portal
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3 mb-1">Staff / Faculty Login</h2>
          <p className="text-slate-500 text-xs mb-6">Enter your institutional staff credentials to manage attendance.</p>

          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="staff@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm"
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
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Staff'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Need Demo Credentials?</span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill Demo Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
