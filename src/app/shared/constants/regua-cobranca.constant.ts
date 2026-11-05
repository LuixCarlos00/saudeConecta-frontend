import { parseDataLocal } from 'src/app/shared/utils/data-local';

/**
 * Dias após o vencimento em que a assinatura passa a SUSPENSA (acesso bloqueado).
 * Espelha a régua do back: saudeConectaAPI CobrancaScheduler (INADIMPLENTE em vencimento+5,
 * SUSPENSA em vencimento+15, CANCELADA em vencimento+30). Se a régua mudar lá, mude aqui.
 */
export const DIAS_ATE_SUSPENSAO = 15;

/**
 * Data em que a assinatura será suspensa (vencimento + DIAS_ATE_SUSPENSAO), à meia-noite local.
 *
 * @param dataVencimento Vencimento 'yyyy-MM-dd' vindo da API
 * @returns Data de suspensão, ou null se o vencimento for inválido
 */
export function calcularDataSuspensao(dataVencimento: string | null | undefined): Date | null {
  const data = dataVencimento ? parseDataLocal(dataVencimento) : null;
  if (!data) { return null; }
  data.setDate(data.getDate() + DIAS_ATE_SUSPENSAO);
  return data;
}
