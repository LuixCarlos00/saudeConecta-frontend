/**
 * API pública da área "relatórios": só o que outras áreas podem usar.
 * Outras áreas importam daqui (`src/app/features/relatorios`), nunca de um caminho interno.
 */
export { RelatorioService } from './data-access/relatorio.service';
