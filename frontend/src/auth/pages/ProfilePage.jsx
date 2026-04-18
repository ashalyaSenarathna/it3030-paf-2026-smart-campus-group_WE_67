import { Link } from 'react-router-dom';

export default function ProfilePage({ user }) {
  const isStudent = user?.roles?.includes('ROLE_STUDENT');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isTechnician = user?.roles?.includes('ROLE_TECHNICIAN');

  return (
    <div className="role-profile-page">
      <header className="role-profile-header">
        <p className="role-profile-eyebrow">User Profile</p>
        <h1>{user?.name || 'User'} Profile</h1>
        <p className="role-profile-subtitle">View your account details and access your role-specific dashboard.</p>
      </header>

      <section className="role-profile-grid">
        <article className="role-panel">
          <h2>Account Details</h2>
          <div className="role-details">
            <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'Guest'}</p>
          </div>
        </article>
      </section>

      <div className="role-profile-actions">
        {isStudent && <Link to="/home" className="button">Go to Student Portal</Link>}
        {isAdmin && <Link to="/admin/dashboard" className="button">Go to Admin Dashboard</Link>}
        {isTechnician && <Link to="/tech/dashboard" className="button">Go to Tech Dashboard</Link>}
      </div>
    </div>
  );
}
