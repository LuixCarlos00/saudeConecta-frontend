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

/**
 * Extrai o `code` do ErrorResponse do back (ex.: PLANO_SEM_ACESSO, PAGAMENTO_JA_RECEBIDO).
 *
 * @param error HttpErrorResponse (ou objeto equivalente)
 * @returns O código quando o corpo é um objeto com `code` textual; senão null
 */
export function extrairCodigoErro(error: any): string | null {
  const codigo = error?.error?.code;
  return typeof codigo === 'string' && codigo.trim() ? codigo : null;
}

/** Texto exibido quando o back não conseguiu atualizar o valor no Mercado Pago (502 MP_VALOR_NAO_ATUALIZADO). */
export const MENSAGEM_MP_VALOR_NAO_ATUALIZADO =
  'Não foi possível atualizar o valor no Mercado Pago. Nenhuma alteração foi feita; tente novamente.';

/**
 * Mensagem de erro para trocar de plano ou customizar limites: o 502 `MP_VALOR_NAO_ATUALIZADO`
 * ganha texto próprio; os demais usam a mensagem do back ou o texto padrão.
 *
 * @param error HttpErrorResponse da troca/customização
 * @param padrao texto quando o back não trouxe mensagem
 * @returns mensagem pronta para o usuário
 */
export function mensagemErroTrocaPlano(error: any, padrao: string): string {
  if (extrairCodigoErro(error) === 'MP_VALOR_NAO_ATUALIZADO') { return MENSAGEM_MP_VALOR_NAO_ATUALIZADO; }
  return extrairMensagemErro(error) || padrao;
}
