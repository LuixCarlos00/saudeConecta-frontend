/**
 * Constantes de endpoints da API
 * Só ficam aqui os endpoints realmente usados (login e rotas públicas do interceptor).
 * Os demais serviços declaram seus próprios paths.
 */

export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/Home/login'
  }
} as const;

/**
 * Tipo para garantir type-safety nos endpoints
 */
export type ApiEndpoint = typeof API_ENDPOINTS;
