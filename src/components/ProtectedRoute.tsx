import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen text="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
