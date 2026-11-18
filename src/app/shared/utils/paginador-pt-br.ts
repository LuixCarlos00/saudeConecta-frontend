import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Textos do mat-paginator em português (o padrão do Material vem em inglês: "Items per page").
 * Use em `providers: [{ provide: MatPaginatorIntl, useClass: PaginadorPtBr }]` do componente.
 */
@Injectable()
export class PaginadorPtBr extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Itens por página';
  override nextPageLabel = 'Próxima página';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primeira página';
  override lastPageLabel = 'Última página';

  /**
   * Faixa exibida ao lado das setas, ex.: "1 – 20 de 63".
   *
   * @param pagina índice da página (base 0)
   * @param tamanho itens por página
   * @param total total de itens
   * @returns texto da faixa
   */
  override getRangeLabel = (pagina: number, tamanho: number, total: number): string => {
    if (total === 0 || tamanho === 0) { return `0 de ${total}`; }
    const inicio = pagina * tamanho;
    const fim = Math.min(inicio + tamanho, total);
    return `${inicio + 1} – ${fim} de ${total}`;
  };
}
