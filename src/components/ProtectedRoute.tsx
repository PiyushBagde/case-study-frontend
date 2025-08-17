import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks'; // Use typed hooks
import { RootState } from '../store/store';     // Import RootState type

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Optional array of allowed roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);

  // 1. Check if authenticated
  if (!isAuthenticated) {
    // Redirect to login page, saving the intended location
    return <Navigate to="/login" replace />;
  }

  // 2. Check roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      // User is authenticated but doesn't have the required role
      // Redirect to an 'Unauthorized' page or back home
      // For simplicity, redirecting home for now
      console.warn(`Role [${user?.role}] not authorized for this route.`);
      return <Navigate to="/" replace />; // Or to a dedicated /unauthorized page
    }
  }

  // 3. If authenticated and authorized (or no roles specified), render the child route
  return <Outlet />; // Renders the nested Route element (e.g., HomePage)
};

export default ProtectedRoute;