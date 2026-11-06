import { Injectable } from '@angular/core';

export interface CodigoTuss { codigo: string; descricao: string; fabricante: string; tabela: number; }
export interface CodigoCid { codigo: string; label: string; }

/**
 * Acesso às tabelas TUSS (~42 mil linhas) e CID (~61 mil linhas).
 * As tabelas são carregadas sob demanda com import() dinâmico, para ficarem em chunks
 * separados e fora do bundle principal; o carregamento acontece uma única vez (cache).
 */
@Injectable({ providedIn: 'root' })
export class CodigosTussCidService {
  private tuss$?: Promise<CodigoTuss[]>;
  private cid$?: Promise<CodigoCid[]>;

  /** Carrega (uma vez) a tabela TUSS completa. */
  carregarTuss(): Promise<CodigoTuss[]> {
    this.tuss$ ??= import('src/app/features/atendimento/data-access/codigos/tuss-Terminologia-unificada-saude-splementar')
      .then(m => m.Tuss_terminologia_Unificada_Saude_Suplementar);
    return this.tuss$;
  }

  /** Carrega (uma vez) a tabela CID completa. */
  carregarCid(): Promise<CodigoCid[]> {
    this.cid$ ??= import('src/app/features/atendimento/data-access/codigos/cid-codigo-internaciona-doecas')
      .then(m => m.Cid_codigo_internaciona_doecas);
    return this.cid$;
  }

  /**
   * Busca TUSS por código ou descrição.
   * @param termo texto digitado (case-insensitive)
   * @param max máximo de resultados
   * @returns itens que contêm o termo, limitado a `max`
   */
  async buscarTuss(termo: string, max: number): Promise<CodigoTuss[]> {
    const t = termo.toLowerCase();
    return (await this.carregarTuss())
      .filter(i => i.codigo.toLowerCase().includes(t) || i.descricao.toLowerCase().includes(t))
      .slice(0, max);
  }

  /**
   * Busca CID por código ou descrição.
   * @param termo texto digitado (case-insensitive)
   * @param max máximo de resultados
   * @returns itens que contêm o termo, limitado a `max`
   */
  async buscarCid(termo: string, max: number): Promise<CodigoCid[]> {
    const t = termo.toLowerCase();
    return (await this.carregarCid())
      .filter(i => i.codigo.toLowerCase().includes(t) || i.label.toLowerCase().includes(t))
      .slice(0, max);
  }
}
