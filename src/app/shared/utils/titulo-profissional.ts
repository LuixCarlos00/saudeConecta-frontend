/** Nome que já começa com título ("Dr.", "Dra.", "Dr ", "dra ") — não pode receber outro. */
const JA_TEM_TITULO = /^dra?\.?\s/i;

/**
 * Prefixo de título para impressões, omitido quando o nome cadastrado já traz o título.
 * Evita "Dr(a). Dra. Bruna" quando a clínica cadastra o profissional com o título no nome.
 *
 * @param nome Nome do profissional, como vem da API
 * @returns "Dr(a). " ou string vazia
 */
export function prefixoTitulo(nome: string | null | undefined): string {
  if (!nome?.trim()) { return ''; }
  return JA_TEM_TITULO.test(nome.trim()) ? '' : 'Dr(a). ';
}

/**
 * Nome do profissional pronto para impressão, com título uma única vez.
 *
 * @param nome Nome do profissional, como vem da API
 * @param padrao Texto devolvido quando não há nome
 * @returns Ex.: "Dr(a). Bruna Costa" ou "Dra. Bruna Costa"
 */
export function nomeComTitulo(nome: string | null | undefined, padrao = '-'): string {
  const limpo = nome?.trim();
  return limpo ? `${prefixoTitulo(limpo)}${limpo}` : padrao;
}
