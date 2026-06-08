import { useAuth } from "@/hooks/useAuth";
import { canCreatePlans, canManageUsers, canOperate, isReadOnly } from "@/utils/rbac";

export function useRbac() {
  const { role } = useAuth();
  return {
    role,
    canManageUsers: canManageUsers(role),
    canCreatePlans: canCreatePlans(role),
    canOperate: canOperate(role),
    isReadOnly: isReadOnly(role)
  };
}
