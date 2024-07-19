// ProtectedRoute.js

import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Cookie from "js-cookie";

const ProtectedRoute = () => {
  const isAuthenticated = !!Cookie.get("access_token"); // Check if access_token cookie exists

  return isAuthenticated ? <Outlet /> : <Navigate to={'/login'} />;
};

export default ProtectedRoute;
