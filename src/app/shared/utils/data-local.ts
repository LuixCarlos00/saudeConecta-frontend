/**
 * Formata uma data no calendário LOCAL como 'yyyy-MM-dd'.
 * Evita `toISOString()` (UTC), que após 21h no Brasil já devolve o dia seguinte.
 *
 * @param data Data a formatar (padrão: agora)
 * @returns String 'yyyy-MM-dd'
 */
export function formatarDataLocal(data: Date = new Date()): string {
  const ano = data.getFullYear().toString().padStart(4, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const dia = data.getDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Formata a hora no fuso LOCAL como 'HH:mm' (24h, com zero à esquerda).
 *
 * @param data Data/hora a formatar
 * @returns String 'HH:mm'
 */
export function formatarHoraLocal(data: Date): string {
  const horas = data.getHours().toString().padStart(2, '0');
  const minutos = data.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Converte 'yyyy-MM-dd' em Date à meia-noite LOCAL (new Date('yyyy-MM-dd') seria UTC).
 *
 * @param texto Data no formato 'yyyy-MM-dd' (ignora sufixo de hora, se houver)
 * @returns Date local, ou null se o texto for inválido
 */
export function parseDataLocal(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto ?? '');
  if (!m) { return null; }
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) { return null; }
  return d;
}

/**
 * Formata data-sem-hora da API ('yyyy-MM-dd') como dd/MM/yyyy no calendário local.
 *
 * @param texto Data 'yyyy-MM-dd' (com ou sem sufixo de hora)
 * @param padrao Texto devolvido quando a data é nula ou inválida
 * @returns Data formatada em pt-BR, ou o padrão
 */
export function formatarDataBr(texto: string | null | undefined, padrao = ''): string {
  const data = texto ? parseDataLocal(texto) : null;
  return data ? data.toLocaleDateString('pt-BR') : padrao;
}

/**
 * Conta dias de CALENDÁRIO entre hoje e a data alvo (ignora horas; imune a horário de verão).
 * No dia do vencimento devolve 0; no dia anterior, 1; depois do vencimento, negativo.
 *
 * @param alvo Data alvo ('yyyy-MM-dd' ou Date)
 * @param hoje Data de referência (padrão: agora)
 * @returns Dias de calendário até o alvo, ou 0 se a data for nula/inválida
 */
export function diasCalendarioAte(alvo: string | Date | null | undefined, hoje: Date = new Date()): number {
  const data = typeof alvo === 'string' ? parseDataLocal(alvo) : alvo;
  if (!data) { return 0; }
  const msDia = 24 * 60 * 60 * 1000;
  const utcAlvo = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate());
  const utcHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((utcAlvo - utcHoje) / msDia);
}
