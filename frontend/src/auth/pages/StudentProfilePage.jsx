import { Link } from 'react-router-dom';

export default function StudentProfilePage({ user }) {
  return (
    <div className="card">
      <h1>Student Profile</h1>
      <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
      <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      <p><strong>Role:</strong> Student</p>
      <Link to="/home" className="button">Back to Home</Link>
    </div>
  );
}
