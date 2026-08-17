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
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            setUser(null);
          }
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

  // Request password reset OTP (supports Mobile 9745307450 or Email)
  const requestForgotPassword = async (emailOrMobile) => {
    try {
      const payload = {};
      if (emailOrMobile && emailOrMobile.includes('@')) {
        payload.email = emailOrMobile;
      } else {
        payload.mobileNumber = emailOrMobile || '9745307450';
      }
      const res = await api.post('/auth/forgot-password', payload);
      toast.success(res.data.message || 'OTP verification code sent');
      return {
        success: true,
        email: res.data.email,
        mobileNumber: res.data.mobileNumber || '9745307450'
      };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to request reset OTP';
      toast.error(msg);
      return { success: false };
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (target, otp, newPassword) => {
    try {
      const payload = { otp, newPassword };
      if (target && target.includes('@')) {
        payload.email = target;
      } else {
        payload.mobileNumber = target || '9745307450';
      }
      const res = await api.post('/auth/reset-password', payload);
      toast.success(res.data.message || 'Password updated successfully! Log in with your new password.');
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

export const useAuth = () => useContext(AuthContext) || {};
