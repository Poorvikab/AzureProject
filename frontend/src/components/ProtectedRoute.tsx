import { Navigate, Outlet } from 'react-router-dom';
import { TOKEN_KEY } from '../api/client';

export default function ProtectedRoute() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
