import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Key, Mail, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

export default function HeadLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginHead } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginHead(email, password);
      if (res.success) {
        navigate('/head/dashboard');
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
    setEmail('head@college.edu');
    setPassword('head');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45 pointer-events-none"
        style={{ backgroundImage: `url('/images/head_bg.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-slate-900/15 to-rose-950/20 pointer-events-none"></div>

      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Role Selection
        </Link>

        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl shadow-red-900/5 border border-slate-200 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mb-6 shadow-md shadow-red-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Head Department
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3 mb-1">Central Dept / Head Login</h2>
          <p className="text-slate-500 text-xs mb-6">Access institutional monitoring, department reports, and send parent SMS alerts.</p>

          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Head / Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="head@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm"
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
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none transition shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/25 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Head'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Need Demo Credentials?</span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill Demo Head
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
