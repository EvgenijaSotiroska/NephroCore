import type { ReactNode } from "react";
import { Navigate } from "react-router";
import useAuth from "../../hooks/useAuth.ts";
import type { Role } from "../../api/types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}