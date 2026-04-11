import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResourceCatalogue from './pages/facility-management/ResourceCatalogue';
import AdminDashboard from './pages/facility-management/AdminDashboard';
import { getCurrentUser, login, logout } from './auth/api';
import ProtectedRoute from './auth/components/ProtectedRoute.jsx';
import LoginPage from './auth/pages/LoginPage.jsx';
import AuthAdminDashboard from './auth/pages/AdminDashboard.jsx';
import TechnicianDashboard from './auth/pages/TechnicianDashboard.jsx';
import ProfilePage from './auth/pages/ProfilePage.jsx';
import AdminProfilePage from './auth/pages/AdminProfilePage.jsx';
import TechnicianProfilePage from './auth/pages/TechnicianProfilePage.jsx';
import StudentProfilePage from './auth/pages/StudentProfilePage.jsx';
import './App.css';
import './auth/auth.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrapUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };

    bootstrapUser();
  }, []);

  const handleLogin = async (email, password) => {
    const loggedInUser = await login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Home onLogout={handleLogout} />} />
      <Route path="/home" element={<Home onLogout={handleLogout} />} />
      <Route path="/login" element={<LoginPage user={user} onLoginSuccess={handleLogin} />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_ADMIN']}>
            <AuthAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tech/dashboard"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_TECHNICIAN']}>
            <TechnicianDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <ProfilePage user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/admin"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_ADMIN']}>
            <AdminProfilePage user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/technician"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_TECHNICIAN']}>
            <TechnicianProfilePage user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/student"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_STUDENT']}>
            <StudentProfilePage user={user} />
          </ProtectedRoute>
        }
      />

      <Route path="/facility-management/resource-catalogue" element={<ResourceCatalogue />} />
      <Route path="/facility-management/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
