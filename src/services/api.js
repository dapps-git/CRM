import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'https://tweaki.pw/crm';
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

// Auto-logout on expired / invalid token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      // Only force logout if the token is explicitly expired or invalid
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'USER_NOT_FOUND' || error.config?.url?.includes('/auth/me')) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
