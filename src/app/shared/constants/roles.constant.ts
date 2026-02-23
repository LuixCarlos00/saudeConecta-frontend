/**
 * Constantes de roles do sistema
 * Centraliza todas as roles para evitar strings hardcoded
 */

export enum Role {
  // Roles legadas
  ADMIN = '[ROLE_ADMIN]',
  SECRETARY = '[ROLE_Secretaria]',
  DOCTOR = '[ROLE_Medico]',
  // Roles multi-tenant (com prefixo ROLE_)
  SUPER_ADMIN = '[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]',
  ADMIN_ORG = '[ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]',
  PROFISSIONAL = '[ROLE_PROFISSIONAL]',
  RECEPCIONISTA = '[ROLE_RECEPCIONISTA]'
}

/**
 * Roles permitidas para acesso ao sistema
 */
export const ALLOWED_ROLES: Role[] = [
  // Roles legadas
  Role.ADMIN,
  Role.SECRETARY,
  Role.DOCTOR,
  // Roles multi-tenant
  Role.SUPER_ADMIN,
  Role.ADMIN_ORG,
  Role.PROFISSIONAL,
  Role.RECEPCIONISTA
];

/**
 * Verifica se uma role é válida
 */
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

/**
 * Verifica se a role tem permissão de administrador
 */
export function isAdmin(role: string): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.ADMIN_ORG;
}

/**
 * Verifica se a role tem permissão de médico
 */
export function isDoctor(role: string): boolean {
  return role === Role.DOCTOR || role === Role.PROFISSIONAL;
}

/**
 * Verifica se a role tem permissão de secretária
 */
export function isSecretary(role: string): boolean {
  return role === Role.SECRETARY || role === Role.RECEPCIONISTA;
}

/**
 * Verifica se é super admin
 */
export function isSuperAdmin(role: string): boolean {
  return role.includes('ROLE_SUPER_ADMIN');
}

/**
 * Verifica se é admin de organização
 */
export function isOrgAdmin(role: string): boolean {
  return role.includes('ROLE_ADMIN') && !role.includes('ROLE_SUPER_ADMIN');
}
