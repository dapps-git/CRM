import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png';

const Splash = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing workspace...');

  useEffect(() => {
    const messages = [
      { at: 0,   text: 'Initializing workspace...' },
      { at: 25,  text: 'Loading core modules...' },
      { at: 55,  text: 'Establishing secure connection...' },
      { at: 80,  text: 'Preparing dashboard...' },
      { at: 100, text: 'Welcome!' },
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      setProgress(Math.min(current, 100));
      const msg = messages.slice().reverse().find(m => current >= m.at);
      if (msg) setStatusText(msg.text);
      if (current >= 100) clearInterval(interval);
    }, 50);

    const timeout = setTimeout(() => {
      sessionStorage.setItem('hasLoadedSplash', 'true');
      const token = localStorage.getItem('token');
      navigate(token ? '/' : '/login', { replace: true });
    }, 3000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
      style={{ background: '#fefae0' }}
    >
      {/* Ambient lighting glows (soft purple & gold) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(138,50,198,0.08) 0%, transparent 60%)',
        }} 
      />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 80% 80%, rgba(244,206,65,0.15) 0%, transparent 55%)',
        }} 
      />

      {/* Main glass card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center z-10 w-full max-w-sm px-7 py-8 relative overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(138, 50, 198, 0.15)',
          borderRadius: '1.25rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.05), 0 0 40px rgba(138,50,198,0.02)',
        }}
      >
        {/* Top accent gradient line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f4ce41, #8a32c6)' }} />

        {/* Logo Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-7 w-full"
        >
          <div 
            className="rounded-2xl flex items-center justify-center overflow-hidden bg-[#8a32c6] px-6 py-3.5 w-full"
            style={{
              boxShadow: '0 6px 20px rgba(138,50,198,0.25)',
              border: '1px solid rgba(244,206,65,0.4)',
              maxWidth: '270px',
            }}
          >
            <img src={logoImg} alt="Logo" style={{ width: '100%', height: 44, objectFit: 'contain' }} />
          </div>
        </motion.div>

        {/* Progress area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full space-y-3"
        >
          {/* Track */}
          <div 
            className="w-full rounded-full overflow-hidden p-0.5" 
            style={{
              height: 7,
              background: '#f3eef8',
              border: '1px solid rgba(138, 50, 198, 0.12)',
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8a32c6, #f4ce41)',
                boxShadow: '0 0 10px rgba(138, 50, 198, 0.35)',
                transition: 'width 0.05s linear',
              }}
            />
          </div>

          {/* Status & percentage */}
          <div className="flex justify-between items-center text-xs px-0.5">
            <span 
              style={{
                fontSize: '10px',
                color: '#76726a',
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {statusText}
            </span>
            <span 
              style={{
                fontSize: '11px',
                fontFamily: 'Montserrat, sans-serif',
                color: '#8a32c6',
                fontWeight: 800,
              }}
            >
              {progress}%
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer watermark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-6"
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          color: '#8c877d',
          fontWeight: 800,
          textTransform: 'uppercase',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        CRM Management System
      </motion.div>
    </div>
  );
};

export default Splash;
