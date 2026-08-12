import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoBypassTime, setDemoBypassTime] = useState(
    localStorage.getItem('demo_bypass_time') === 'true'
  );

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('attendance_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session restore failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginStudent = async (registerNumber, password) => {
    const res = await api.post('/auth/student-login', { registerNumber, password });
    if (res.data.success) {
      localStorage.setItem('attendance_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const loginStaff = async (email, password) => {
    const res = await api.post('/auth/staff-login', { email, password });
    if (res.data.success) {
      localStorage.setItem('attendance_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const loginHead = async (email, password) => {
    const res = await api.post('/auth/head-login', { email, password });
    if (res.data.success) {
      localStorage.setItem('attendance_token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('attendance_token');
    setUser(null);
  };

  const toggleDemoBypassTime = (value) => {
    setDemoBypassTime(value);
    localStorage.setItem('demo_bypass_time', value ? 'true' : 'false');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginStudent,
        loginStaff,
        loginHead,
        logout,
        demoBypassTime,
        toggleDemoBypassTime
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
