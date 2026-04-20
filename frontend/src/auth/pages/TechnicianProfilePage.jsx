import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updatePassword } from '../api';

export default function TechnicianProfilePage({ user }) {
  const [profile, setProfile] = useState(user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    getProfile()
      .then((data) => setProfile(data))
      .catch(() => setProfile(user));
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const result = await updatePassword(currentPassword, newPassword);
    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.message || 'Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="role-profile-page">
      <header className="role-profile-header">
        <p className="role-profile-eyebrow">Role Profile</p>
        <h1>Technician Profile</h1>
        <p className="role-profile-subtitle">Keep your service account secure and aligned with support responsibilities.</p>
      </header>

      <section className="role-profile-grid">
        <article className="role-panel">
          <h2>Account Information</h2>
          <div className="role-details">
            <p><strong>Name:</strong> {profile?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {profile?.email || 'N/A'}</p>
            <p><strong>Role:</strong> Technician</p>
          </div>
        </article>

        <article className="role-panel">
          <h2>Technician Access Scope</h2>
          <ul className="role-list">
            <li>Process and update support tickets</li>
            <li>Manage technical resource availability</li>
            <li>Track maintenance schedules and status</li>
          </ul>
        </article>
      </section>

      <section className="role-panel">
        <h2>Update Password</h2>
        <form onSubmit={handleSubmit} className="role-password-form">
          <label>
            Current password
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" required />
          </label>
          <label>
            New password
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required />
          </label>
          <button type="submit">Update Password</button>
        </form>
        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </section>

      <div className="role-profile-actions">
        <Link to="/tech/dashboard" className="button">Back to Technician Dashboard</Link>
      </div>
    </div>
  );
}
