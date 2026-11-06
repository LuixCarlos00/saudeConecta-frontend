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

/** Texto para o cliente (gestor da clínica) quando há um pagamento antigo em análise (409 PREAPPROVAL_SUBSTITUIDO_EM_ANALISE). */
export const MENSAGEM_PREAPPROVAL_EM_ANALISE_CLIENTE =
  'Há um pagamento anterior em análise. Aguarde a conclusão ou entre em contato com o suporte.';

/**
 * Mensagem de erro para trocar de plano ou customizar limites: o 502 `MP_VALOR_NAO_ATUALIZADO` e o 409
 * `PREAPPROVAL_SUBSTITUIDO_EM_ANALISE` ganham texto próprio; os demais usam a mensagem do back ou o texto padrão.
 *
 * @param error HttpErrorResponse da troca/customização
 * @param padrao texto quando o back não trouxe mensagem
 * @returns mensagem pronta para o usuário
 */
export function mensagemErroTrocaPlano(error: any, padrao: string): string {
  const codigo = extrairCodigoErro(error);
  if (codigo === 'MP_VALOR_NAO_ATUALIZADO') { return MENSAGEM_MP_VALOR_NAO_ATUALIZADO; }
  if (codigo === 'PREAPPROVAL_SUBSTITUIDO_EM_ANALISE') { return MENSAGEM_PREAPPROVAL_EM_ANALISE_CLIENTE; }
  return extrairMensagemErro(error) || padrao;
}

/** Textos por `code` das ações do SUPER_ADMIN sobre assinaturas (contrato admin-assinaturas, seção 6). */
const MENSAGENS_ASSINATURA_ADMIN: Record<string, string> = {
  MP_VALOR_NAO_ATUALIZADO: 'O Mercado Pago não aceitou o novo valor. O plano não foi alterado; tente de novo.',
  ASSINATURA_SUSPENSA: 'Clínica suspensa: dê cortesia ou cancele a assinatura antes de associar um plano.',
  ASSINATURA_CANCELADA: 'Esta assinatura está cancelada e não pode ser suspensa.',
  PREAPPROVAL_SUBSTITUIDO_EM_ANALISE: 'Há um pagamento anterior em análise. Resolva a pendência no Mercado Pago antes.',
  PENDENCIA_JA_RESOLVIDA: 'Esta pendência já foi resolvida por outra pessoa.',
  ACESSO_NEGADO: 'Você não tem permissão para esta ação.',
};

/**
 * Mensagem de erro das telas do SUPER_ADMIN (assinaturas, associar plano, pendências): o `code` do back
 * ganha o texto do contrato; sem código conhecido usa a mensagem do back ou o padrão.
 *
 * @param error HttpErrorResponse da ação
 * @param padrao texto quando o back não trouxe mensagem
 * @returns mensagem pronta para o usuário
 */
export function mensagemErroAssinaturaAdmin(error: any, padrao: string): string {
  const codigo = extrairCodigoErro(error);
  if (codigo && MENSAGENS_ASSINATURA_ADMIN[codigo]) { return MENSAGENS_ASSINATURA_ADMIN[codigo]; }
  if (error?.status === 503) { return 'Integração com o Mercado Pago indisponível no momento. Tente novamente mais tarde.'; }
  return mensagemErroTrocaPlano(error, padrao);
}
