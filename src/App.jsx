import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import StudentLogin from './pages/StudentLogin';
import StaffLogin from './pages/StaffLogin';
import HeadLogin from './pages/HeadLogin';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import HeadDashboard from './pages/HeadDashboard';

// Protected Route Guard Wrapper
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    if (allowedRole === 'student') return <Navigate to="/login/student" replace />;
    if (allowedRole === 'staff') return <Navigate to="/login/staff" replace />;
    if (allowedRole === 'head') return <Navigate to="/login/head" replace />;
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole && !(allowedRole === 'staff' && user.role === 'head')) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Role Portal Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Dedicated Login Pages */}
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/staff" element={<StaffLogin />} />
          <Route path="/login/head" element={<HeadLogin />} />

          {/* Protected Dashboards */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/head/dashboard"
            element={
              <ProtectedRoute allowedRole="head">
                <HeadDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
