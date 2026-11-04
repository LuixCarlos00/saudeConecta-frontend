/**
 * Extrai a mensagem útil do corpo de um HttpErrorResponse do back.
 * Suporta ErrorResponse `{ message, error, errors? }` (errors: mapa campo->mensagem ou lista), corpo string e
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

  // Validação (400): `errors` traz as mensagens por campo; `message` é só a junção delas.
  const errors = corpo.errors;
  const candidatos: any[] = Array.isArray(errors)
    ? errors.map((e: any) => (typeof e === 'string' ? e : e?.defaultMessage || e?.message))
    : errors && typeof errors === 'object' ? Object.values(errors) : [];
  const textos = candidatos.filter((t: any) => typeof t === 'string' && t.trim());
  if (textos.length) { return textos.join('\n'); }

  if (typeof corpo.message === 'string' && corpo.message.trim()) { return corpo.message; }
  if (typeof corpo.error === 'string' && corpo.error.trim()) { return corpo.error; }

  // Legado: mapa solto { campo: 'mensagem' } sem envelope
  const valores = Object.values(corpo).filter((v) => typeof v === 'string' && v) as string[];
  return valores.length ? valores.join('\n') : null;
}
