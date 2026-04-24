import { Link } from 'react-router-dom';
import './StudentProfilePage.css';

export default function StudentProfilePage({ user }) {
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  return (
    <div className="sp-root">
      {/* Ambient glows */}
      <div className="sp-glow sp-glow--purple" />
      <div className="sp-glow sp-glow--blue" />

      <div className="sp-content">

        {/* ── Hero banner ── */}
        <div className="sp-hero">
          <div className="sp-avatar">
            <span className="sp-avatar__initials">{initials}</span>
            <span className="sp-avatar__ring" />
          </div>

          <div className="sp-hero__text">
            <span className="sp-eyebrow">Student Profile</span>
            <h1 className="sp-name">{user?.name || 'Student'}</h1>
            <p className="sp-email">{user?.email || '—'}</p>
          </div>

          <div className="sp-role-badge">
            <span className="sp-role-dot" />
            Student
          </div>
        </div>

        {/* ── Cards grid ── */}
        <div className="sp-grid">

          {/* Account info */}
          <div className="sp-card">
            <div className="sp-card__header">
              <span className="sp-card__icon">👤</span>
              <h2 className="sp-card__title">Account Information</h2>
            </div>
            <div className="sp-card__body">
              <div className="sp-field">
                <span className="sp-field__label">Full Name</span>
                <span className="sp-field__value">{user?.name || 'N/A'}</span>
              </div>
              <div className="sp-divider" />
              <div className="sp-field">
                <span className="sp-field__label">Email Address</span>
                <span className="sp-field__value">{user?.email || 'N/A'}</span>
              </div>
              <div className="sp-divider" />
              <div className="sp-field">
                <span className="sp-field__label">Role</span>
                <span className="sp-field__value sp-field__value--badge">Student</span>
              </div>
            </div>
          </div>

          {/* Access scope */}
          <div className="sp-card">
            <div className="sp-card__header">
              <span className="sp-card__icon">🎓</span>
              <h2 className="sp-card__title">Student Access Scope</h2>
            </div>
            <div className="sp-card__body">
              {[
                { icon: '🚌', text: 'Access smart campus transport features' },
                { icon: '📚', text: 'Request out-of-hours classroom bookings' },
                { icon: '🔧', text: 'Monitor and submit maintenance requests' },
                { icon: '📅', text: 'View and manage your facility reservations' },
              ].map((item, i) => (
                <div key={i} className="sp-scope-item">
                  <span className="sp-scope-item__icon">{item.icon}</span>
                  <span className="sp-scope-item__text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="sp-card sp-card--wide">
            <div className="sp-card__header">
              <span className="sp-card__icon">⚡</span>
              <h2 className="sp-card__title">Quick Actions</h2>
            </div>
            <div className="sp-actions-grid">
              <Link to="/bookings/my-bookings" className="sp-action-btn">
                <span className="sp-action-btn__icon">📋</span>
                <span className="sp-action-btn__label">My Bookings</span>
              </Link>
              <Link to="/bookings/all" className="sp-action-btn">
                <span className="sp-action-btn__icon">🏛️</span>
                <span className="sp-action-btn__label">All Bookings</span>
              </Link>
              <Link to="/facility-management/resource-catalogue" className="sp-action-btn">
                <span className="sp-action-btn__icon">🔍</span>
                <span className="sp-action-btn__label">Browse Resources</span>
              </Link>
              <Link to="/home" className="sp-action-btn">
                <span className="sp-action-btn__icon">🏠</span>
                <span className="sp-action-btn__label">Home</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
