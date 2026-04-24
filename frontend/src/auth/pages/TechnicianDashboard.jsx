import { useNavigate } from 'react-router-dom';
import NotificationPanel from '../../notification/NotificationPanel';

export default function TechnicianDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="card">
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Technician Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationPanel user={user} />
          <button
            className="button"
            onClick={() => navigate('/profile/technician')}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            👤 Profile
          </button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <p>Welcome to the technician dashboard. Role-based access is enforced here.</p>
      {user && <p className="user-info">Logged in as: {user.email}</p>}
    </div>
  );
}
