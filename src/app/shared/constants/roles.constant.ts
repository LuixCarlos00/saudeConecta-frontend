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
