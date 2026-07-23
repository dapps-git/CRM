import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'https://tweaki.pw/crm';
const cleanBase = rawBase.replace(/\/+$/, '');
const baseURL = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

const api = axios.create({
  baseURL,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on expired / invalid token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response.data?.code;
      // Clear stale token so branding still loads, redirect if logged in
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'USER_NOT_FOUND') {
        localStorage.removeItem('token');
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
