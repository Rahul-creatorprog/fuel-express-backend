import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("fe_token");
  const userStr = localStorage.getItem("fe_user");

  if (!token || !userStr) {
    // Redirect to root if not logged in
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userStr);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to access denied if role mismatch
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default ProtectedRoute;
