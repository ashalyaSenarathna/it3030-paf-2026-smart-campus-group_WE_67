import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updatePassword } from '../api';
import NotificationPanel from '../../notification/NotificationPanel';
import './ProfileWithSidebar.css';
import './StudentProfilePage.css';

export default function TechnicianProfilePage({ user, onLogout }) {
  const navigate = useNavigate();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TC';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirm, setConfirm]                 = useState('');
  const [msg, setMsg]                         = useState(null);
  const [err, setErr]                         = useState(null);
  const [loading, setLoading]                 = useState(false);

  const handleLogout = () => { if (onLogout) onLogout(); navigate('/login'); };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    if (newPassword !== confirm) { setErr('New passwords do not match.'); return; }
    if (newPassword.length < 6)  { setErr('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const result = await updatePassword(currentPassword, newPassword);
      if (result.error) { setErr(result.error); }
      else { setMsg(result.message || 'Password updated successfully.'); setCurrentPassword(''); setNewPassword(''); setConfirm(''); }
    } catch { setErr('Failed to update password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="pws-layout">

      {/* ── Sidebar ── */}
      <aside className="pws-sidebar">
        <div className="pws-sidebar__brand">
          <div className="pws-brand-dot"></div>
          Smart Campus
        </div>

        <div className="pws-sidebar__user">
          <div className="pws-sidebar__avatar">{initials}</div>
          <div>
            <p className="pws-sidebar__uname">{user?.name || 'Technician'}</p>
            <p className="pws-sidebar__urole">Technician</p>
          </div>
        </div>

        <nav className="pws-sidebar__nav">
          {[
            { icon: '🖥️', label: 'Dashboard',  to: '/tech/dashboard' },
            { icon: '👤', label: 'Profile',     to: '/profile/technician', active: true },
            { icon: '📅', label: 'Bookings',    to: '/bookings/all' },
            { icon: '🏢', label: 'Resources',   to: '/facility-management/resource-catalogue' },
            { icon: '🏠', label: 'Home',        to: '/home' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className={`pws-nav-item ${item.active ? 'pws-nav-item--active' : ''}`}>
              <span className="pws-nav-item__icon">{item.icon}</span>
              <span className="pws-nav-item__label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pws-sidebar__footer">
          <NotificationPanel user={user} />
          <button className="pws-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="pws-main">
        <div className="sp-glow sp-glow--purple" />
        <div className="sp-glow sp-glow--blue" />

        <div className="sp-content">
          {/* Hero */}
          <div className="sp-hero">
            <div className="sp-avatar">
              <span className="sp-avatar__initials">{initials}</span>
              <span className="sp-avatar__ring" />
            </div>
            <div className="sp-hero__text">
              <span className="sp-eyebrow">Technician Profile</span>
              <h1 className="sp-name">{user?.name || 'Technician'}</h1>
              <p className="sp-email">{user?.email || '—'}</p>
            </div>
            <div className="sp-role-badge">
              <span className="sp-role-dot" />
              Technician
            </div>
          </div>

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
                  <span className="sp-field__value sp-field__value--badge">Technician</span>
                </div>
              </div>
            </div>

            {/* Access scope */}
            <div className="sp-card">
              <div className="sp-card__header">
                <span className="sp-card__icon">🔧</span>
                <h2 className="sp-card__title">Technician Access Scope</h2>
              </div>
              <div className="sp-card__body">
                {[
                  { icon: '🎫', text: 'Process and update support tickets' },
                  { icon: '🏗️', text: 'Manage technical resource availability' },
                  { icon: '📋', text: 'Track maintenance schedules and status' },
                  { icon: '🔔', text: 'Receive alerts for new maintenance requests' },
                ].map((item, i) => (
                  <div key={i} className="sp-scope-item">
                    <span className="sp-scope-item__icon">{item.icon}</span>
                    <span className="sp-scope-item__text">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change password */}
            <div className="sp-card sp-card--wide">
              <div className="sp-card__header">
                <span className="sp-card__icon">🔒</span>
                <h2 className="sp-card__title">Change Password</h2>
              </div>
              <div className="sp-card__body">
                <form onSubmit={handlePasswordSubmit} className="sp-pw-form">
                  <div className="sp-pw-fields">
                    <div className="sp-pw-group">
                      <label className="sp-pw-label">Current Password</label>
                      <input className="sp-pw-input" type="password" value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password" />
                    </div>
                    <div className="sp-pw-group">
                      <label className="sp-pw-label">New Password</label>
                      <input className="sp-pw-input" type="password" value={newPassword}
                        onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 6 characters" />
                    </div>
                    <div className="sp-pw-group">
                      <label className="sp-pw-label">Confirm New Password</label>
                      <input className="sp-pw-input" type="password" value={confirm}
                        onChange={e => setConfirm(e.target.value)} required placeholder="Repeat new password" />
                    </div>
                  </div>
                  {msg && <div className="sp-pw-success">{msg}</div>}
                  {err && <div className="sp-pw-error">{err}</div>}
                  <button type="submit" className="sp-pw-btn" disabled={loading}>
                    {loading ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
