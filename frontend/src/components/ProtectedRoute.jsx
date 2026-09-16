import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
  const auth = useSelector((state) => state.auth);

  // Retrieve authenticated user from active session or any logged-in role session
  const currentUser = auth.user || 
                    auth.organizer?.user || 
                    auth.admin?.user || 
                    auth.plot_owner?.user || 
                    auth.customer?.user ||
                    JSON.parse(sessionStorage.getItem('organizer_user') || 'null') ||
                    JSON.parse(sessionStorage.getItem('admin_user') || 'null') ||
                    JSON.parse(sessionStorage.getItem('plot_owner_user') || 'null') ||
                    JSON.parse(sessionStorage.getItem('customer_user') || 'null');

  const isAuthenticated = auth.isAuthenticated || 
                          !!currentUser || 
                          !!auth.token || 
                          !!sessionStorage.getItem('organizer_token') || 
                          !!sessionStorage.getItem('admin_token') || 
                          !!sessionStorage.getItem('plot_owner_token') || 
                          !!sessionStorage.getItem('customer_token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    const rolePath = currentUser.role === 'plot_owner' ? '/plotowner' : `/${currentUser.role}`;
    return <Navigate to={rolePath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
