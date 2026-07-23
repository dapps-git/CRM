import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiKey, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';

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
  fontSize: '9px',
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#76726a',
  marginBottom: 8,
  fontFamily: 'Montserrat, sans-serif',
};

const Login = () => {
  const navigate = useNavigate();
  const { setUser, requestForgotPassword, confirmPasswordReset, companyName, companyLogo } = useAuth();

  const [stage, setStage] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Invalid credentials');
      } else {
        localStorage.setItem('token', data.token);
        setUser({ _id: data._id, email: data.email });
        toast.success(`Welcome to ${companyName}!`);
        navigate('/');
      }
    } catch {
      toast.error('Cannot reach server. Is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    const res = await requestForgotPassword(email);
    setLoading(false);
    if (res.success) setStage('forgot_reset');
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error('Please fill all fields');
    setLoading(true);
    const res = await confirmPasswordReset(email, otp, newPassword);
    setLoading(false);
    if (res.success) { setStage('login'); setOtp(''); setNewPassword(''); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#fefae0' }}
    >
      {/* Background glows (soft yellow/purple) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(138,50,198,0.06) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 40% at 80% 80%, rgba(244,206,65,0.12) 0%, transparent 55%)',
      }} />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm z-10 relative"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(138, 50, 198, 0.15)',
          borderRadius: '1.25rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.05), 0 0 40px rgba(138,50,198,0.02)',
          padding: '2.25rem 1.75rem',
          overflow: 'hidden',
        }}
      >
        {/* Yellow/Purple Top Border Accent Line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f4ce41, #8a32c6)' }} />

        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 rounded-2xl flex items-center justify-center overflow-hidden bg-[#8a32c6] px-6 py-3.5" style={{
            boxShadow: '0 6px 20px rgba(138,50,198,0.25)',
            border: '1px solid rgba(244,206,65,0.4)',
            maxWidth: '270px',
            width: '100%',
          }}>
            <img 
              src={companyLogo || logoImg} 
              alt="Logo" 
              style={{ width: '100%', height: 44, objectFit: 'contain' }} 
              onError={(e) => { e.target.src = logoImg; }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* === LOGIN FORM === */}
          {stage === 'login' && (
            <motion.form key="login"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}
              onSubmit={handleLoginSubmit} className="space-y-5"
            >
              <div>
                <label style={LABEL_STYLE}>Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input
                    id="login-email" type="email" required placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '10px 12px 10px 36px' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label style={LABEL_STYLE}>Password</label>
                  <button type="button" onClick={() => setStage('forgot_email')}
                    style={{ fontSize: '9px', color: '#b08d02', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', background: 'none', cursor: 'pointer' }}>
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input
                    id="login-password" type={showPassword ? 'text' : 'password'}
                    required placeholder="••••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '10px 36px 10px 36px' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#a5a198', border: 'none', background: 'none', cursor: 'pointer' }}>
                    {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit" type="submit" disabled={loading}
                className="w-full py-3 font-bold rounded-xl text-white text-sm mt-2 transition-all duration-200"
                style={{
                  background: loading ? '#c9a8e8' : '#8a32c6',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(138,50,198,0.25)',
                  letterSpacing: '0.06em',
                  fontFamily: 'Montserrat, sans-serif',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a35ad6'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#8a32c6'; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : 'Sign In'}
              </button>
            </motion.form>
          )}

          {/* === FORGOT EMAIL === */}
          {stage === 'forgot_email' && (
            <motion.form key="forgot_email"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}
              onSubmit={handleForgotEmailSubmit} className="space-y-5"
            >
              <button type="button" onClick={() => setStage('login')}
                style={{ color: '#8a32c6', fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer' }}>
                <FiArrowLeft size={11} /> Back to Login
              </button>
              <p style={{ fontSize: '11px', color: '#76726a', lineHeight: 1.7, fontWeight: 500 }}>
                Enter your registered email — a 6-digit OTP will be sent to reset your password.
              </p>
              <div>
                <label style={LABEL_STYLE}>Registered Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input type="email" required placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '10px 12px 10px 36px' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 font-bold rounded-xl text-white text-sm"
                style={{
                  background: loading ? '#c9a8e8' : '#8a32c6',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(138,50,198,0.25)',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'Montserrat, sans-serif',
                  letterSpacing: '0.06em',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a35ad6'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#8a32c6'; }}
              >
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </motion.form>
          )}

          {/* === FORGOT RESET === */}
          {stage === 'forgot_reset' && (
            <motion.form key="forgot_reset"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}
              onSubmit={handleForgotResetSubmit} className="space-y-5"
            >
              <div className="rounded-lg p-3 text-xs" style={{
                background: 'rgba(138,50,198,0.06)', border: '1px solid rgba(138,50,198,0.12)',
                color: '#2c2438', lineHeight: 1.7, fontWeight: 500
              }}>
                OTP sent to <span style={{ color: '#b08d02', fontWeight: 700 }}>{email}</span>
              </div>

              <div>
                <label style={LABEL_STYLE}>6-Digit OTP</label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input type="text" required maxLength="6" placeholder="123456"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ ...INPUT_BASE, width: '100%', padding: '10px 12px 10px 36px', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 700, fontSize: '1rem' }}
                    onFocus={e => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={e => Object.assign(e.target.style, INPUT_BLUR)}
                  />
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8a32c6', fontSize: 14 }} />
                  <input type={showNew ? 'text' : 'password'} required placeholder="New password"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={{ ...INPUT_BASE, width: '100%', padding: '10px 36px 10px 36px' }}
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

              <div className="flex space-x-3">
                <button type="button" onClick={() => setStage('forgot_email')}
                  className="flex-1 py-3 font-semibold rounded-xl text-sm"
                  style={{ background: '#fafaf9', border: '1px solid #e5e3de', color: '#57544e', fontFamily: 'Montserrat, sans-serif', cursor: 'pointer' }}>
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 font-bold rounded-xl text-sm text-white"
                  style={{
                    background: loading ? '#c9a8e8' : '#8a32c6',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(138,50,198,0.25)',
                    opacity: loading ? 0.6 : 1,
                    fontFamily: 'Montserrat, sans-serif',
                    letterSpacing: '0.06em',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a35ad6'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#8a32c6'; }}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
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
