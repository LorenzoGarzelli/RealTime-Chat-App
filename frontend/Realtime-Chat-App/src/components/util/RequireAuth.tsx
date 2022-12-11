import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth-context';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  let auth = useAuth();
  let location = useLocation();
  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
