import { Link } from 'react-router-dom';

export default function ProfilePage({ user }) {
  return (
    <div className="card">
      <h1>Profile</h1>
      <div className="profile-details">
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
        <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'N/A'}</p>
      </div>
      <Link
        to={
          user?.roles?.includes('ROLE_ADMIN')
            ? '/admin/dashboard'
            : user?.roles?.includes('ROLE_TECHNICIAN')
              ? '/tech/dashboard'
              : '/home'
        }
        className="button"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
