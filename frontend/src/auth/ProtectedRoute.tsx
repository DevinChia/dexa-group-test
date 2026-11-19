import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

type ProtectedRouteProps = {
  allowedRole?: 'employee' | 'hrd';
};

function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;