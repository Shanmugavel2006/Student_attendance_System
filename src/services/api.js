import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendance_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const demoBypass = localStorage.getItem('demo_bypass_time');
  if (demoBypass === 'true') {
    config.headers['x-demo-bypass-time'] = 'true';
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
