/**
 * Extrai a mensagem útil do corpo de um HttpErrorResponse do back.
 * Suporta corpo string, `{ message }`, `{ errors: [...] }` (Bean Validation) e
 * mapa `{ campo: 'mensagem' }` (resposta de @Valid).
 *
 * @param error HttpErrorResponse (ou objeto equivalente)
 * @returns Mensagem encontrada, ou null quando o corpo não traz texto utilizável
 */
export function extrairMensagemErro(error: any): string | null {
  const corpo = error?.error;
  if (!corpo) { return null; }
  if (typeof corpo === 'string') { return corpo.trim() || null; }
  if (typeof corpo !== 'object') { return null; }

  if (typeof corpo.message === 'string' && corpo.message.trim()) { return corpo.message; }

  if (Array.isArray(corpo.errors)) {
    const textos = corpo.errors
      .map((e: any) => (typeof e === 'string' ? e : e?.defaultMessage || e?.message))
      .filter((t: any) => typeof t === 'string' && t);
    if (textos.length) { return textos.join('\n'); }
  }

  const valores = Object.values(corpo).filter((v) => typeof v === 'string' && v) as string[];
  return valores.length ? valores.join('\n') : null;
}
