import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authUtils } from "../features/auth/auth.utils";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = authUtils.isAuthenticated();

  if (!isAuth) {
    // Redirect to login while remembering where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
