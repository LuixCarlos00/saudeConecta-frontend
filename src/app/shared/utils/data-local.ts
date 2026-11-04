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
