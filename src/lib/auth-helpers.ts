import { Session } from "next-auth"

type UserRole = "USER" | "TEACHER" | "ADMIN"

/**
 * Check if the user has TEACHER or ADMIN role.
 * Teachers and admins both have access to teacher features.
 */
export function isTeacher(session: Session | null): boolean {
  const role = session?.user?.role as UserRole | undefined
  return role === "TEACHER" || role === "ADMIN"
}

/**
 * Check if the user has ADMIN role.
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "ADMIN"
}

/**
 * Get a display-friendly role label with proper casing.
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "TEACHER":
      return "Teacher"
    default:
      return "User"
  }
}

/**
 * Get the role badge color config for UI display.
 */
export function getRoleBadgeStyle(role: string): { bg: string; text: string } {
  switch (role) {
    case "ADMIN":
      return { bg: "rgba(234, 179, 8, 0.15)", text: "#eab308" }
    case "TEACHER":
      return { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" }
    default:
      return { bg: "rgba(107, 114, 128, 0.15)", text: "#6b7280" }
  }
}

/** All valid roles for the role assignment UI */
export const VALID_ROLES: UserRole[] = ["USER", "TEACHER", "ADMIN"]
