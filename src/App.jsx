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

// Protected Route — checks if user is logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{ minHeight: '100vh', background: '#fefae0' }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#8a32c6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route — if already logged in, redirect to dashboard
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected Application Routes */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/business" element={<ProtectedRoute><Layout><Business /></Layout></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Layout><Finance /></Layout></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Layout><Members /></Layout></ProtectedRoute>} />
          <Route path="/leaves" element={<ProtectedRoute><Layout><Leaves /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
