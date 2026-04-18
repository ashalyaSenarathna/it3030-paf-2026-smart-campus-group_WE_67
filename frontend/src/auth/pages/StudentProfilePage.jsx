import { Link } from 'react-router-dom';

export default function StudentProfilePage({ user }) {
  return (
    <div className="role-profile-page">
      <header className="role-profile-header">
        <p className="role-profile-eyebrow">Role Profile</p>
        <h1>Student Profile</h1>
        <p className="role-profile-subtitle">View your core academic account details and access university resources.</p>
      </header>

      <section className="role-profile-grid">
        <article className="role-panel">
          <h2>Account Information</h2>
          <div className="role-details">
            <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Role:</strong> Student</p>
          </div>
        </article>

        <article className="role-panel">
          <h2>Student Access Scope</h2>
          <ul className="role-list">
            <li>Access smart campus transport features</li>
            <li>Request out-of-hours classroom bookings</li>
            <li>Monitor and submit maintenance requests</li>
          </ul>
        </article>
      </section>

      <div className="role-profile-actions">
        <Link to="/home" className="button">Back to Home</Link>
      </div>
    </div>
  );
}
