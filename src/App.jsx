import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/Layout';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Business from './pages/Business';
import Finance from './pages/Finance';
import Members from './pages/Members';
import Leaves from './pages/Leaves';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Guard to make sure the user sees the Splash screen first
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const hasLoadedSplash = sessionStorage.getItem('hasLoadedSplash');

  if (!hasLoadedSplash) {
    return <Navigate to="/splash" replace />;
  }

  // While the JWT is being validated, show a minimal blank screen
  if (loading) {
    return (
      <div
        style={{ minHeight: '100vh', background: '#0e0906' }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const hasLoadedSplash = sessionStorage.getItem('hasLoadedSplash');

  if (!hasLoadedSplash) {
    return <Navigate to="/splash" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Splash — always accessible, no auth check */}
          <Route path="/splash" element={<Splash />} />

          {/* Login — public but guarded by splash */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/business" element={<ProtectedRoute><Layout><Business /></Layout></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Layout><Finance /></Layout></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Layout><Members /></Layout></ProtectedRoute>} />
          <Route path="/leaves" element={<ProtectedRoute><Layout><Leaves /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

          {/* Any unknown route → Splash first */}
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f1108',
            color: '#f5e6d3',
            border: '1px solid #3a2415',
            fontSize: '12px',
            fontWeight: '600',
          },
          duration: 3000,
        }}
      />
    </AuthProvider>
  );
};

export default App;
