import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '/api';
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

// Response interceptor - handle automatic 24h token refresh or session expiry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest?._retry) {
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                             originalRequest?.url?.includes('/auth/verify-password') ||
                             originalRequest?.url?.includes('/auth/refresh-token');

      if (!isAuthEndpoint) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const res = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
            const { token: newToken, refreshToken: newRefreshToken } = res.data;
            localStorage.setItem('token', newToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);

            return api(originalRequest);
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshErr);
          } finally {
            isRefreshing = false;
          }
        } else {
          localStorage.removeItem('token');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
