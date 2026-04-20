import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, requiredRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
