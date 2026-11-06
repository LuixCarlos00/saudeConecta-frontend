import { UrlMatcher, UrlSegment } from '@angular/router';

/**
 * Cria o matcher de uma area carregada sob demanda (lazy) sem alterar nenhuma URL.
 *
 * Casa quando o primeiro segmento da URL esta na lista (a URL vazia conta como '') e
 * NAO consome segmentos: as rotas do `*-routing.module` da area continuam declarando
 * o path completo (ex.: 'startconsulta/:consultaId'), exatamente como no app-routing antigo.
 * O chunk da area so e baixado quando a URL pertence a ela.
 *
 * @param caminhos primeiros segmentos de URL atendidos pela area ('' = pagina inicial)
 * @returns matcher para usar em `{ matcher, loadChildren }`
 */
export function caminhosDaArea(...caminhos: string[]): UrlMatcher {
  return (segmentos: UrlSegment[]) => {
    const primeiro = segmentos.length > 0 ? segmentos[0].path : '';
    return caminhos.includes(primeiro) ? { consumed: [] } : null;
  };
}
