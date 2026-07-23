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
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ background: 'radial-gradient(circle at 50% 40%, #160d26 0%, #090510 100%)' }}
    >
      {/* Background ambient glowing spheres */}
      <div 
        className="absolute pointer-events-none rounded-full" 
        style={{
          top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(138, 50, 198, 0.22) 0%, rgba(138, 50, 198, 0) 70%)',
          filter: 'blur(60px)',
        }} 
      />
      <div 
        className="absolute pointer-events-none rounded-full" 
        style={{
          bottom: '15%', right: '25%',
          width: 380, height: 380,
          background: 'radial-gradient(circle, rgba(244, 206, 65, 0.12) 0%, rgba(244, 206, 65, 0) 70%)',
          filter: 'blur(70px)',
        }} 
      />

      {/* Main glass card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center z-10 w-full max-w-sm px-8 py-10 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo Container with glowing ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 flex flex-col items-center w-full"
        >
          <div 
            className="rounded-2xl flex items-center justify-center px-6 py-4 relative w-full"
            style={{
              maxHeight: 85,
              background: 'linear-gradient(135deg, rgba(138, 50, 198, 0.45) 0%, rgba(92, 27, 138, 0.65) 100%)',
              boxShadow: '0 0 50px rgba(138, 50, 198, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4)',
              border: '1.5px solid rgba(244, 206, 65, 0.65)',
            }}
          >
            <img src={logoImg} alt="Logo" style={{ width: '100%', height: 52, objectFit: 'contain' }} />
          </div>
        </motion.div>

        {/* Progress bar area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full space-y-3"
        >
          {/* Progress bar track */}
          <div 
            className="w-full rounded-full overflow-hidden p-0.5" 
            style={{
              height: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8a32c6, #b07ef8, #f4ce41)',
                boxShadow: '0 0 15px rgba(244, 206, 65, 0.6)',
                transition: 'width 0.06s linear',
              }}
            />
          </div>

          {/* Status text & percentage */}
          <div className="flex justify-between items-center text-xs px-0.5">
            <span 
              style={{
                fontSize: '11px',
                color: 'rgba(237, 223, 249, 0.75)',
                fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: '0.04em',
              }}
            >
              {statusText}
            </span>
            <span 
              style={{
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#f4ce41',
                fontWeight: 700,
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
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-8"
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.22em',
          color: 'rgba(237, 223, 249, 0.35)',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        Management Workspace
      </motion.div>
    </div>
  );
};

export default Splash;
