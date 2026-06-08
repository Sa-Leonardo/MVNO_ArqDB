import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";

interface RoleRouteProps {
  roles: UserRole[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { role } = useAuth();
  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
