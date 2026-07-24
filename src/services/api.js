import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'https://tweaki.pw/crm';
const cleanBase = rawBase.replace(/\/+$/, '');
const baseURL = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

const api = axios.create({
  baseURL,
});

// Attach JWT token as query parameter to eliminate CORS preflight header restrictions
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.params = config.params || {};
      config.params.token = token;
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
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
