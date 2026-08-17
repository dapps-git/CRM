import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiKey, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';
import api from '../services/api';

/* Shared input styles for light theme */
const INPUT_BASE = {
  background: '#ffffff',
  border: '1px solid rgba(138, 50, 198, 0.18)',
  borderRadius: '0.625rem',
  color: '#2c2438',
  fontSize: '13px',
  fontFamily: 'Montserrat, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const INPUT_FOCUS = { borderColor: '#8a32c6', boxShadow: '0 0 0 3px rgba(138, 50, 198, 0.12)' };
const INPUT_BLUR  = { borderColor: 'rgba(138, 50, 198, 0.18)', boxShadow: 'none' };

const LABEL_STYLE = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: 8,
  fontFamily: 'Montserrat, sans-serif',
};

const Login = () => {
  const navigate = useNavigate();
  const { setUser, requestForgotPassword, confirmPasswordReset, companyName, companyLogo } = useAuth();

  const [stage, setStage] = useState('login'); // 'login' | 'forgot_email' | 'forgot_reset'
  const [email, setEmail] = useState('crevionads@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & OTP state
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login Form Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password: cleanPassword });
      const data = res.data;
      localStorage.setItem('token', data.token);
      setUser({ _id: data._id, email: data.email });
      toast.success(`Welcome to ${companyName}!`);
      navigate('/');
    } catch (err) {
      console.error('Login submit error:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.request) {
        toast.error('Network Error: Unable to connect to backend server');
      } else {
        toast.error(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Verification OTP via Nodemailer
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = email.trim() || 'crevionads@gmail.com';
    setLoading(true);
    const res = await requestForgotPassword(targetEmail);
    setLoading(false);
    if (res.success) {
      setOtp(''); // Require user to type code from their real email inbox
      setStage('forgot_reset');
    }
  };

  // Step 2: Confirm OTP & Set New Password
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error('Please fill all fields');
    setLoading(true);
    const targetEmail = email.trim() || 'crevionads@gmail.com';
    const res = await confirmPasswordReset(targetEmail, otp, newPassword);
    setLoading(false);
    if (res.success) {
      setStage('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setIssuedOtp('');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#fefae0' }}
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(138,50,198,0.12) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 40% at 80% 80%, rgba(244,206,65,0.18) 0%, transparent 55%)',
      }} />

      {/* Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm z-10 relative"
        style={{
          background: 'linear-gradient(145deg, #8a32c6 0%, #681ea8 100%)',
          border: '1px solid rgba(244, 206, 65, 0.35)',
          borderRadius: '0',
          boxShadow: '0 25px 60px rgba(138,50,198,0.35), 0 0 40px rgba(138,50,198,0.15)',
          padding: '2.5rem 2rem',
          overflow: 'hidden',
        }}
      >
        {/* Top Accent Line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f4ce41, #ffffff)' }} />

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src={companyLogo || logoImg} 
            alt="Logo" 
            style={{ width: '85%', maxHeight: 64, objectFit: 'contain' }} 
            onError={(e) => { e.target.src = logoImg; }}
          />
        </div>

        <AnimatePresence mode="wait">

          {/* === STAGE 1: LOGIN FORM === */}
          {stage === 'login' && (
            <motion.form key="login"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}
              onSubmit={handleLoginSubmit} className="space-y-5"
            >
              <div>
                <label style={LABEL_STYLE}>Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 15 }} />
                  <input
                    id="login-email" type="email" required placeholder="crevionads@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '11px 12px 11px 38px', borderRadius: '0' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between items-center">
                  <label style={LABEL_STYLE}>Password</label>
                  <button
                    type="button"
                    onClick={() => setStage('forgot_email')}
                    style={{ color: '#f4ce41', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', border: 'none', background: 'none', cursor: 'pointer' }}
                    className="hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 15 }} />
                  <input
                    id="login-password" type={showPassword ? 'text' : 'password'}
                    required placeholder="••••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '11px 38px 11px 38px', borderRadius: '0' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: '#8a32c6', border: 'none', background: 'none', cursor: 'pointer' }}>
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit" type="submit" disabled={loading}
                className="w-full py-3.5 font-extrabold text-sm mt-3 transition-all duration-200 uppercase tracking-wider"
                style={{
                  background: loading ? '#ebd77f' : 'linear-gradient(90deg, #f4ce41 0%, #ebd46a 100%)',
                  color: '#43126d',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(0,0,0,0.2)',
                  fontFamily: 'Montserrat, sans-serif',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-[#43126d] border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : 'Sign In'}
              </button>
            </motion.form>
          )}

          {/* === STAGE 2: FORGOT PASSWORD EMAIL (NODEMAILER) === */}
          {stage === 'forgot_email' && (
            <motion.form key="forgot_email"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}
              onSubmit={handleEmailSubmit} className="space-y-5"
            >
              <button type="button" onClick={() => setStage('login')}
                style={{ color: '#f4ce41', fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', itemsAlign: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer' }}>
                <FiArrowLeft size={12} /> Back to Login
              </button>

              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">Nodemailer Email Verification</h3>
                <p style={{ fontSize: '11px', color: '#ffffff', lineHeight: 1.6, fontWeight: 500 }}>
                  Enter your admin email address to receive a 6-digit OTP verification code via Nodemailer.
                </p>
              </div>

              <div>
                <label style={LABEL_STYLE}>Admin Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input type="email" required placeholder="crevionads@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '10px 12px 10px 36px', borderRadius: '0' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 font-bold text-white text-xs uppercase tracking-wider"
                style={{
                  background: loading ? '#c9a8e8' : '#f4ce41',
                  color: loading ? '#ffffff' : '#43126d',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(0,0,0,0.2)',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'Montserrat, sans-serif',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Sending Email OTP...' : 'Send Verification Email OTP'}
              </button>
            </motion.form>
          )}

          {/* === STAGE 3: OTP VERIFICATION & SET NEW PASSWORD === */}
          {stage === 'forgot_reset' && (
            <motion.form key="forgot_reset"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}
              onSubmit={handleForgotResetSubmit} className="space-y-4"
            >
              <div className="p-3 text-xs space-y-1.5" style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(244,206,65,0.3)',
                color: '#ffffff', lineHeight: 1.5, fontWeight: 500
              }}>
                <div>Verification OTP sent to: <span style={{ color: '#f4ce41', fontWeight: 800 }}>{email}</span></div>
                <div className="text-[10.5px] text-amber-200">Please check your email inbox for the 6-digit code.</div>
              </div>

              <div>
                <label style={LABEL_STYLE}>Enter 6-Digit OTP</label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input type="text" required maxLength="6" placeholder="123456"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ ...INPUT_BASE, width: '100%', padding: '9px 12px 9px 36px', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 700, fontSize: '0.95rem', borderRadius: '0' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>Set New Admin Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input type={showNew ? 'text' : 'password'} required placeholder="Enter new password"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '9px 36px 9px 36px', borderRadius: '0' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#a5a198', border: 'none', background: 'none', cursor: 'pointer' }}>
                    {showNew ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button type="button" onClick={() => setStage('forgot_email')}
                  className="flex-1 py-2.5 font-semibold text-xs text-neutral-700 bg-white border border-neutral-300"
                  style={{ fontFamily: 'Montserrat, sans-serif', cursor: 'pointer' }}>
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 font-bold text-xs uppercase tracking-wider"
                  style={{
                    background: loading ? '#ebd77f' : '#f4ce41',
                    color: '#43126d',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(0,0,0,0.2)',
                    opacity: loading ? 0.6 : 1,
                    fontFamily: 'Montserrat, sans-serif',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </motion.form>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
