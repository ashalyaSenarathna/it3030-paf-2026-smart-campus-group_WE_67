import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationPanel from '../notification/NotificationPanel';
import './Nav.css';

const Nav = ({ user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');
  const isStudent = user?.roles?.includes('ROLE_STUDENT') || user?.roles?.includes('STUDENT');
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN') || user?.roles?.includes('TECHNICIAN');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/home') return true;
    return location.pathname === path;
  };

  return (
    <nav className={`global-navbar ${scrolled ? 'global-navbar--scrolled' : ''}`}>
      <Link to="/" className="global-brand">
        <span className="global-brand-icon">🏛️</span>
        Smart Campus
      </Link>

      <ul className="global-nav-links">
        <li>
          <Link to="/" className={`global-nav-item ${isActive('/') ? 'global-nav-item--active' : ''}`}>Home</Link>
        </li>
        <li>
          <Link to="/facility-management/resource-catalogue" className={`global-nav-item ${isActive('/facility-management/resource-catalogue') ? 'global-nav-item--active' : ''}`}>Resources</Link>
        </li>
        {user ? (
          <>
            <li>
              <Link to="/bookings/my-bookings" className={`global-nav-item ${isActive('/bookings/my-bookings') ? 'global-nav-item--active' : ''}`}>My Bookings</Link>
            </li>
            <li>
              <Link to="/bookings/all" className={`global-nav-item ${isActive('/bookings/all') ? 'global-nav-item--active' : ''}`}>Bookings</Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/admin/dashboard" className={`global-nav-item ${isActive('/admin/dashboard') ? 'global-nav-item--active' : ''}`}>Admin</Link>
              </li>
            )}
            {isAdmin && (
              <li>
                <Link to="/profile/admin" className={`global-nav-item ${isActive('/profile/admin') ? 'global-nav-item--active' : ''}`}>Profile</Link>
              </li>
            )}
            {isStudent && (
              <li>
                <Link to="/profile/student" className={`global-nav-item ${isActive('/profile/student') ? 'global-nav-item--active' : ''}`}>Profile</Link>
              </li>
            )}
            {isTech && (
              <li>
                <Link to="/profile/technician" className={`global-nav-item ${isActive('/profile/technician') ? 'global-nav-item--active' : ''}`}>Profile</Link>
              </li>
            )}
            <li>
              <button className="global-nav-item global-logout-btn" onClick={handleLogout}>Logout</button>
            </li>
            <li style={{ display: 'flex', alignItems: 'center' }}>
              <NotificationPanel user={user} />
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" className="global-nav-item">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Nav;
