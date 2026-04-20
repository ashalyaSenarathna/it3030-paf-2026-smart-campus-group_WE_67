import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResourceCatalogue from './pages/facility-management/ResourceCatalogue';
import { getCurrentUser, login, logout } from './auth/api';
import ProtectedRoute from './auth/components/ProtectedRoute.jsx';
import LoginPage from './auth/pages/LoginPage.jsx';
import AuthAdminDashboard from './auth/pages/AdminDashboard.jsx';
import TechnicianDashboard from './auth/pages/TechnicianDashboard.jsx';
import ProfilePage from './auth/pages/ProfilePage.jsx';
import AdminProfilePage from './auth/pages/AdminProfilePage.jsx';
import TechnicianProfilePage from './auth/pages/TechnicianProfilePage.jsx';
import StudentProfilePage from './auth/pages/StudentProfilePage.jsx';
import UserBookings from './pages/Booking/UserBookings.jsx';
import AllBookings from './pages/Booking/AllBookings.jsx';
import './App.css';
import './auth/auth.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrapUser = async () => {
      // Try to load from localStorage first for immediate UI responsiveness
      const savedUser = localStorage.getItem('sc_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        localStorage.setItem('sc_user', JSON.stringify(currentUser));
      } catch {
        // If the server says we're not logged in, clear the local state
        setUser(null);
        localStorage.removeItem('sc_user');
      }
    };

    bootstrapUser();
  }, []);

  const handleLogin = async (username, password) => {
    const loggedInUser = await login(username, password);
    setUser(loggedInUser);
    localStorage.setItem('sc_user', JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      localStorage.removeItem('sc_user');
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
      <Route path="/home" element={<Home user={user} onLogout={handleLogout} />} />
      <Route path="/login" element={<LoginPage user={user} onLoginSuccess={handleLogin} />} />

      {/* Admin Unified Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_ADMIN']}>
            <AuthAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-management/admin"
        element={
          <ProtectedRoute user={user} requiredRoles={['ROLE_ADMIN']}>
            <AuthAdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/admin"
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

      <Route
        path="/bookings/my-bookings"
        element={
          <ProtectedRoute user={user}>
            <UserBookings user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/all"
        element={
          <ProtectedRoute user={user}>
            <AllBookings user={user} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
