import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminProfilePage = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="admin-profile-root">
      <div className="profile-container-glass">
        <header className="profile-header">
          <div className="profile-avatar-large">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <h1>Account Settings</h1>
          <p>Managed administrative identity and security clearance.</p>
        </header>

        <div className="profile-sections">
          <section className="p-section">
            <h2 className="p-section-title">Identity</h2>
            <div className="p-info-row">
              <label>Username</label>
              <span>{user?.username || 'N/A'}</span>
            </div>
            <div className="p-info-row">
              <label>Institutional Email</label>
              <span>{user?.email || 'N/A'}</span>
            </div>
            <div className="p-info-row">
              <label>Access Role</label>
              <span className="p-role-badge">System Administrator</span>
            </div>
          </section>

          <section className="p-section">
            <h2 className="p-section-title">Security & Permissions</h2>
            <div className="p-permissions-grid">
              <div className="p-perm-item">
                <span className="p-p-icon">🛡️</span>
                <div>
                  <div className="p-p-name">Full Asset Control</div>
                  <p className="p-p-desc">Add, edit, or remove university facilities.</p>
                </div>
              </div>
              <div className="p-perm-item">
                <span className="p-p-icon">⚖️</span>
                <div>
                  <div className="p-p-name">Booking Authority</div>
                  <p className="p-p-desc">Final approval on all reservation requests.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="profile-footer-actions">
           <button className="btn-secondary-glass" onClick={() => navigate('/admin/dashboard')}>
             Return to Workspace
           </button>
        </div>
      </div>

      <style>{`
        .admin-profile-root {
          min-height: 100vh;
          background: #050508;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #fff;
        }
        .profile-container-glass {
          width: 100%;
          max-width: 800px;
          background: rgba(13, 12, 20, 0.4);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border-radius: 40px;
          padding: 4rem;
          animation: profileSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes profileSlide {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-header { text-align: center; margin-bottom: 4rem; }
        .profile-avatar-large {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #8b5cf6, #d946ef);
          border-radius: 24px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 900;
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
        }
        .profile-header h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 0.5rem; }
        .profile-header p { color: #64748b; font-size: 1rem; }

        .profile-sections { display: flex; flex-direction: column; gap: 3rem; }
        .p-section-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
        
        .p-info-row { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .p-info-row label { color: #64748b; font-weight: 600; }
        .p-info-row span { font-weight: 700; }
        
        .p-role-badge { background: rgba(139, 92, 246, 0.1); color: #c084fc; padding: 4px 12px; border-radius: 50px; font-size: 0.8rem; border: 1px solid rgba(139, 92, 246, 0.2); }

        .p-permissions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .p-perm-item { display: flex; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .p-p-icon { font-size: 1.5rem; }
        .p-p-name { font-weight: 800; margin-bottom: 4px; }
        .p-p-desc { font-size: 0.8rem; color: #64748b; line-height: 1.4; }

        .profile-footer-actions { margin-top: 4rem; display: flex; justify-content: center; }
        .btn-secondary-glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 14px 30px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .btn-secondary-glass:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default AdminProfilePage;
