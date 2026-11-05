/** Item de código TUSS/CID recuperado de uma linha de texto salva no prontuário. */
export interface ItemCodigoTexto {
  codigo: string;
  descricao: string;
}

/** Linha gerada pelas abas de códigos: "1. [10101012] Consulta em consultório" (com ou sem recuo). */
const LINHA_CODIGO = /^\s*\d+\.\s*\[([^\]]+)\]\s*(.*)$/;

/**
 * Reconstrói a lista de códigos a partir do texto que a aba de códigos gravou no prontuário.
 * Serve para a edição: o back guarda só o texto, e sem a lista a aba apagaria as linhas
 * antigas ao adicionar ou remover um código. Linhas fora do padrão (texto livre) são ignoradas.
 *
 * @param texto texto salvo (tussTexto ou cidTexto)
 * @returns itens na ordem do texto
 */
export function extrairItensCodigo(texto: string | null | undefined): ItemCodigoTexto[] {
  return (texto ?? '').split('\n').flatMap(linha => {
    const m = LINHA_CODIGO.exec(linha);
    return m ? [{ codigo: m[1], descricao: m[2].trim() }] : [];
  });
}

/**
 * Reconstrói as listas TUSS e CID da solicitação de exame, que o texto salvo separa pelos
 * cabeçalhos "TUSS:" e "CID:".
 *
 * @param texto texto salvo (solicitacaoExameTexto)
 * @returns itens de TUSS e de CID na ordem do texto
 */
export function extrairItensSolicitacaoExame(
  texto: string | null | undefined
): { tuss: ItemCodigoTexto[]; cid: ItemCodigoTexto[] } {
  const resultado = { tuss: [] as ItemCodigoTexto[], cid: [] as ItemCodigoTexto[] };
  let secao: 'tuss' | 'cid' | null = null;
  for (const linha of (texto ?? '').split('\n')) {
    const cabecalho = linha.trim();
    if (cabecalho === 'TUSS:') { secao = 'tuss'; continue; }
    if (cabecalho === 'CID:') { secao = 'cid'; continue; }
    const itens = secao ? extrairItensCodigo(linha) : [];
    if (secao && itens.length) { resultado[secao].push(...itens); }
  }
  return resultado;
}
