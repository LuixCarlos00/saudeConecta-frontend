import { MotivoAtencaoPlataforma, StatusAssinaturaPlataforma } from 'src/app/services/api/plataforma-dashboard-api.service';

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorInteiro = new Intl.NumberFormat('pt-BR');

/**
 * Formata valor em reais no padrão pt-BR (R$ 1.234,56).
 *
 * @param valor número em reais (null/undefined viram 0)
 * @returns texto formatado
 */
export function formatarMoeda(valor: number | null | undefined): string {
  return formatadorMoeda.format(valor ?? 0);
}

/**
 * Formata inteiro com separador de milhar pt-BR.
 *
 * @param valor quantidade (null/undefined viram 0)
 * @returns texto formatado
 */
export function formatarInteiro(valor: number | null | undefined): string {
  return formatadorInteiro.format(valor ?? 0);
}

/**
 * Converte mês 'yyyy-MM' em rótulo curto ('nov/25').
 *
 * @param mes mês no formato do contrato
 * @returns rótulo curto, ou o próprio texto se não puder ser interpretado
 */
export function rotuloMes(mes: string): string {
  const partes = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!partes) { return mes; }
  const nome = MESES_ABREV[Number(partes[2]) - 1];
  return nome ? `${nome}/${partes[1].slice(2)}` : mes;
}

/**
 * Variação percentual entre dois valores.
 *
 * @param atual valor do mês atual
 * @param anterior valor do mês anterior
 * @returns percentual com sinal, ou null quando não há base de comparação (anterior = 0)
 */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (!anterior) { return null; }
  return ((atual - anterior) / anterior) * 100;
}

/** Rótulos legíveis dos status de assinatura. */
export const ROTULO_STATUS: Record<StatusAssinaturaPlataforma, string> = {
  ATIVA: 'Ativa',
  TRIAL: 'Trial',
  INADIMPLENTE: 'Inadimplente',
  SUSPENSA: 'Suspensa',
  CANCELADA: 'Cancelada'
};

/** Rótulos legíveis dos motivos de atenção. */
export const ROTULO_MOTIVO: Record<MotivoAtencaoPlataforma, string> = {
  PENDENCIA_MANUAL: 'Pendência manual',
  SUSPENSA: 'Suspensa',
  INADIMPLENTE: 'Inadimplente',
  TRIAL_VENCENDO: 'Trial vencendo'
};
