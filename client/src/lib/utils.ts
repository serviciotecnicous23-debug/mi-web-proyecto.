import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Roles con acceso de administrador global */
export function isAdminRole(role?: string): boolean {
  return ["admin", "director", "staff_global"].includes(role || "");
}

/** Roles con acceso de maestro o administrador */
export function isTeacherOrAdminRole(role?: string): boolean {
  return ["admin", "director", "staff_global", "obrero", "maestro_ministerio", "maestro_iglesia", "admin_iglesia"].includes(role || "");
}
