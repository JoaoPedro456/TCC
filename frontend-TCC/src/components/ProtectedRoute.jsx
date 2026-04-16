import { Navigate } from 'react-router-dom';
import { tokenExpirado } from '../utils/token';

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token || tokenExpirado(token)) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  return children;
}
