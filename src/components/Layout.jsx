import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiBriefcase, 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiFileText, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
} from 'react-icons/fi';
import logoImg from '../assets/logo.png';

const Layout = ({ children }) => {
  const { user, logout, companyName, companyLogo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  const navItems = [
    { name: 'Dashboard',        path: '/',          icon: FiHome },
    { name: 'Business Numbers', path: '/business',  icon: FiBriefcase },
    { name: 'Expenses',         path: '/finance',   icon: FiDollarSign },
    { name: 'Members',          path: '/members',   icon: FiUsers },
    { name: 'Leave Management', path: '/leaves',    icon: FiCalendar },
    { name: 'Reports',          path: '/reports',   icon: FiFileText },
    { name: 'Settings',         path: '/settings',  icon: FiSettings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-neutral-50 text-neutral-800">
      
      {/* --- Mobile Header --- */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#8a32c6] text-white">
        <div className="flex items-center space-x-2">
          <img 
            src={companyLogo || logoImg} 
            alt="Logo" 
            className="h-11 max-w-[220px] w-auto object-contain"
            onError={(e) => { e.target.src = logoImg; }}
          />
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded text-white">
          {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* --- Sidebar --- */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 h-screen flex flex-col justify-between flex-shrink-0
          transform transition-transform duration-300 md:translate-x-0 md:sticky md:top-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: '#8a32c6', // Solid purple sidebar
          boxShadow: '4px 0 16px rgba(138, 50, 198, 0.05)',
        }}
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Brand header */}
          <div className="hidden md:flex flex-col items-center justify-center px-4 py-7 border-b border-purple-400/20">
            <img 
              src={companyLogo || logoImg}
              alt="Logo"
              className="h-16 max-w-[230px] w-auto object-contain transition-transform duration-200 hover:scale-105"
              style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }}
              onError={(e) => { e.target.src = logoImg; }}
            />
          </div>

          {/* Navigation */}
          <nav className="px-3 py-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all duration-150"
                  style={isActive ? {
                    background: '#f4ce41', // Gold active background pill
                    color: '#2c2438',      // Dark text
                  } : {
                    color: '#eddff9',      // Soft purple text
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#eddff9'; }}}
                >
                  <Icon size={15} style={{ color: isActive ? '#2c2438' : '#eddff9' }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer — Always visible at bottom */}
        <div className="p-3 border-t border-purple-400/20 flex-shrink-0 bg-[#8a32c6]">
          <div className="flex items-center space-x-3 px-3 py-2.5 mb-2 text-purple-100">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-xs border border-white/20">
              A
            </div>
            <div>
              <div className="text-[12px] font-semibold">Admin</div>
              <div className="text-[10px] font-mono text-purple-200 truncate w-36">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[12px] font-semibold tracking-wide transition-colors"
            style={{ color: '#ffb3b3' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FiLogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen" style={{ background: '#fefae0' }}>
        
        {/* Top Navbar */}
        <header
          className="hidden md:flex items-center justify-between px-7 py-3.5"
          style={{
            background: '#fefae0',
            borderBottom: '1px solid rgba(138, 50, 198, 0.1)',
          }}
        >
          <div className="flex items-center space-x-3 text-[11px] font-medium text-neutral-500">
            <span>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-neutral-300">│</span>
            <span className="font-mono text-brand-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          <div className="text-sm font-semibold text-neutral-600">
            Welcome back, <span className="text-brand-600 font-bold">Admin 👋</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8" style={{ background: '#fefae0' }}>
          {children}
        </main>
      </div>

    </div>
  );
};

export default Layout;
