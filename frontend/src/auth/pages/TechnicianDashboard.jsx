import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TicketDashboard from '../../pages/incident/TicketDashboardPage';

const TABS = {
  TASKS: 'My Tasks',
  PROFILE: 'My Profile'
};

export default function TechnicianDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS.TASKS);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-root">
      {/* Sidebar - Same style as Admin for consistency */}
      <aside className="sidebar-glass">
        <div className="sidebar-brand">
          <div className="brand-dot" style={{ background: '#fbbf24', boxShadow: '0 0 15px #fbbf24' }}></div>
          Tech Portal
        </div>
        <nav className="sidebar-nav-container">
          {[
            { id: TABS.TASKS, icon: '🔧', label: 'My Tasks' },
            { id: TABS.PROFILE, icon: '👤', label: 'Profile' }
          ].map((tab) => (
            <div
              key={tab.id}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={activeTab === tab.id ? { background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' } : {}}
              onClick={() => {
                if (tab.id === TABS.PROFILE) navigate('/profile/technician');
                else setActiveTab(tab.id);
              }}
            >
              <span className="nav-i">{tab.icon}</span>
              <span className="nav-t">{tab.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport-glass">
        {activeTab === TABS.TASKS && (
          <div className="tab-pane animate-in">
            <header className="tab-header">
              <div className="hero-badge" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)' }}>Technician Access</div>
              <h1>Maintenance Hub</h1>
              <p>Manage and resolve campus incidents assigned to you.</p>
            </header>

            {/* Reusing the Incident Dashboard component which already filters for 'Assigned to Me' when tech role is detected */}
            <div className="mt-2">
              <TicketDashboard />
            </div>
          </div>
        )}
      </main>

      {/* Local styles inherited from Admin but with Technician colors */}
      <style>{`
        .admin-dashboard-root { display: flex; min-height: 100vh; background: #050508; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; }
        .sidebar-glass { width: 260px; background: rgba(13, 12, 20, 0.4); border-right: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(20px); display: flex; flex-direction: column; padding: 2rem 0; }
        .sidebar-brand { padding: 0 2rem; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 10px; margin-bottom: 3rem; }
        .brand-dot { width: 10px; height: 10px; border-radius: 50%; }
        .sidebar-nav-container { flex: 1; padding: 0 1rem; }
        .sidebar-nav-item { display: flex; align-items: center; gap: 15px; padding: 14px 20px; border-radius: 12px; cursor: pointer; color: #64748b; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 6px; }
        .sidebar-nav-item:hover { background: rgba(255,255,255,0.03); color: #fff; }
        .sidebar-nav-item.active { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
        .main-viewport-glass { flex: 1; padding: 3rem 6%; overflow-y: auto; height: 100vh; }
        .sidebar-footer { padding: 0 1rem; }
        .btn-logout-sidebar { width: 100%; background: rgba(248, 113, 113, 0.05); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 700; transition: all 0.2s; }
        .btn-logout-sidebar:hover { background: rgba(248, 113, 113, 0.15); border-color: rgba(248, 113, 113, 0.3); }

        .hero-badge { display: inline-block; padding: 6px 14px; border-radius: 50px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
        .tab-header h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .tab-header p { color: #64748b; margin-bottom: 1rem; }

        .animate-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .sidebar-glass { width: 80px; }
          .nav-t, .sidebar-brand { display: none; }
          .sidebar-nav-item { justify-content: center; padding: 15px; }
        }
      `}</style>
    </div>
  );
}
