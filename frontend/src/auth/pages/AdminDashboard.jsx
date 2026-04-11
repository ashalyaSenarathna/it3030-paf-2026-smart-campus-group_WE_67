import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
  };

  return (
    <div className="card">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
      <p>Welcome to the admin dashboard. Access is protected by role-based authentication.</p>
      {user && <p className="user-info">Logged in as: {user.email}</p>}
      <button type="button" className="button" onClick={() => navigate('/profile/admin')}>
        Go to Profile
      </button>
    </div>
  );
}
