import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

function Home({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      }
    } finally {
      navigate('/login');
    }
  };

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');
  const isStudent = user?.roles?.includes('ROLE_STUDENT') || user?.roles?.includes('STUDENT');
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN') || user?.roles?.includes('TECHNICIAN');

  const modules = [
    {
      id: 'facility',
      title: 'Facility Management',
      description: 'Manage university resources, classroom bookings, and maintenance requests in one place.',
      icon: '🏢',
      link: '/facility-management/resource-catalogue',
      action: 'Launch Dashboard',
      gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
      accentColor: '#7c3aed',
    },
    {
      id: 'student',
      title: 'Student Portal',
      description: 'Access course materials, exam schedules, and academic records conveniently.',
      icon: '🎓',
      link: '/home',
      action: 'Open Portal',
      gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
      accentColor: '#0ea5e9',
    },
    {
      id: 'transport',
      title: 'Campus Transport',
      description: 'Track shuttle locations, view schedules, and manage parking permits.',
      icon: '🚌',
      link: '#',
      action: 'View Transit',
      placeholder: true,
      gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
      accentColor: '#f97316',
    }
  ];

  return (
    <main className="home-page">
      {/* Animated background blobs */}
      <div className="bg-blob blob-1" aria-hidden="true"></div>
      <div className="bg-blob blob-2" aria-hidden="true"></div>
      <div className="bg-blob blob-3" aria-hidden="true"></div>

      <nav className="home-navbar">
        <div className="navbar-brand">
          <span className="brand-icon">🏛️</span>
          Smart Campus
        </div>
        <ul className="nav-links">
          <li><Link to="/" className="nav-item active">Home</Link></li>
          <li><Link to="/facility-management/resource-catalogue" className="nav-item">Resources</Link></li>
          
          {user ? (
            <>
              <li><Link to="/bookings/my-bookings" className="nav-item">My Bookings</Link></li>
              {isAdmin && <li><Link to="/admin/dashboard" className="nav-item">Admin Dashboard</Link></li>}
              {isStudent && <li><Link to="/profile/student" className="nav-item">Profile</Link></li>}
              {isTech && <li><Link to="/profile/technician" className="nav-item">Tech Profile</Link></li>}
              <li>
                <button type="button" className="nav-item nav-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li><Link to="/login" className="nav-item">Login</Link></li>
          )}
          
          <li><a href="#" className="nav-item">Support</a></li>
        </ul>
      </nav>

      <section className="home-hero">
        <div className="hero-badge">✨ Your Digital Campus Companion</div>
        <h1>Welcome to Your <span className="gradient-text">Smart Campus</span> Hub</h1>
        <p>Your integrated digital companion for managing university operations with seamless efficiency and modern intelligence.</p>
      </section>

      <section className="modules-section">
        <div className="modules-grid">
          {modules.map((module, index) => (
            <Link 
              key={module.id} 
              to={module.link} 
              className={`module-card ${module.placeholder ? 'is-placeholder' : ''}`}
              style={{ 
                '--card-accent': module.accentColor,
                '--card-gradient': module.gradient,
                animationDelay: `${index * 0.12}s`
              }}
            >
              <div className="card-glow" aria-hidden="true"></div>
              <div className="module-icon-wrap" style={{ background: module.gradient }}>
                <span className="module-icon">{module.icon}</span>
              </div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <div className="module-action">
                {module.action} <span className="arrow">→</span>
              </div>
              {module.placeholder && <div className="coming-soon-badge">Coming Soon</div>}
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>© 2026 Smart Campus — WE_146_3.1</p>
      </footer>
    </main>
  );
}

export default Home;
