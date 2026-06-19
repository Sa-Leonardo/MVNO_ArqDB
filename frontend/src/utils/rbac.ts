import type { UserRole } from "@/types/api";

export function canManageUsers(role?: UserRole): boolean {
  return role === "admin";
}

export function canCreatePlans(role?: UserRole): boolean {
  return role === "admin";
}

export function canOperate(role?: UserRole): boolean {
  return role === "admin" || role === "operator";
}

export function isReadOnly(role?: UserRole): boolean {
  return role === "viewer";
}
