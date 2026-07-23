import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme] = useState('light');

  // ── Branding state (shared globally) ──
  const [companyName, setCompanyName] = useState('Crevionads');
  const [companyLogo, setCompanyLogo] = useState('');

  // Initialize auth + load branding
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
    loadBranding();
  }, []);

  // Load branding from backend (called on init and after settings save)
  const loadBranding = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setCompanyName(res.data.companyName || 'Crevionads');
        setCompanyLogo(res.data.companyLogo || '');
      }
    } catch {
      // silently fall back to defaults
    }
  };

  // Request password reset OTP
  const requestForgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Reset code sent to email');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to request reset';
      toast.error(msg);
      return { success: false };
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (email, otp, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success(res.data.message || 'Password reset successful');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password';
      toast.error(msg);
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        theme,
        requestForgotPassword,
        confirmPasswordReset,
        logout,
        // branding
        companyName,
        companyLogo,
        setCompanyName,
        setCompanyLogo,
        loadBranding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
