import { Link } from 'react-router-dom';

export default function AdminProfilePage({ user }) {
  return (
    <div className="card">
      <h1>Admin Profile</h1>
      <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
      <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      <p><strong>Role:</strong> Administrator</p>
      <Link to="/admin/dashboard" className="button">Back to Admin Dashboard</Link>
    </div>
  );
}
