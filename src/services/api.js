import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanBase = rawBase.replace(/\/+$/, '');
const baseURL = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

const api = axios.create({
  baseURL,
});

// Attach JWT token to requests in multiple bulletproof ways (Headers + Query Param)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
      config.headers['X-Auth-Token'] = token;

      // Attach token to params as backup for Apache/cPanel stripping Authorization headers on DELETE/PUT
      config.params = {
        token,
        ...config.params,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors gracefully without forcing logouts on button clicks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
