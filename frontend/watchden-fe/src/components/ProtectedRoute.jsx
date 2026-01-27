import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const isAuthenticated = true; // Force TRUE for testing

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
