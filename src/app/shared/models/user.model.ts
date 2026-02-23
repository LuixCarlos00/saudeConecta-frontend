/**
 * Interface para usuário do sistema
 */
export interface User {
  id: number;
  login: string;
  roles: string;
  status?: UserStatus;
}

/**
 * Interface para dados decodificados do token JWT
 */
export interface UserToken {
  id: number;
  sub: string;
  aud: string;
  exp: number;
  iss: string;
}

/**
 * Status do usuário
 */
export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  BLOCKED = 2
}

/**
 * DTO para criação de usuário
 */
export interface CreateUserDto {
  login: string;
  senha: string;
  roles: number;
}

/**
 * DTO para login
 */
export interface LoginDto {
  login: string;
  senha: string;
}

/**
 * Resposta de login
 */
export interface LoginResponse {
  token: string;
  tokenJWT?: string;
  usuarioView?: User;
}
