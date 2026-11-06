import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface CodigoTuss { codigo: string; descricao: string; fabricante: string; tabela: number; }
export interface CodigoCid { codigo: string; label: string; }

/** Arquivos estáticos das tabelas (src/assets/codigos), servidos pelo próprio front. */
const URL_TUSS = 'assets/codigos/tuss.json';
const URL_CID = 'assets/codigos/cid.json';

/**
 * Acesso às tabelas TUSS (~7 mil itens) e CID (~14 mil itens).
 * As tabelas ficam em JSON dentro de assets e só são baixadas na primeira busca, fora do
 * bundle do app; depois de baixadas ficam em cache (uma vez por tabela). Se o download falhar,
 * a próxima busca tenta de novo.
 */
@Injectable({ providedIn: 'root' })
export class CodigosTussCidService {
  private tuss$?: Promise<CodigoTuss[]>;
  private cid$?: Promise<CodigoCid[]>;

  constructor(private http: HttpClient) {}

  /** Carrega (uma vez) a tabela TUSS completa. */
  carregarTuss(): Promise<CodigoTuss[]> {
    this.tuss$ ??= firstValueFrom(this.http.get<CodigoTuss[]>(URL_TUSS)).catch(erro => {
      this.tuss$ = undefined;
      throw erro;
    });
    return this.tuss$;
  }

  /** Carrega (uma vez) a tabela CID completa. */
  carregarCid(): Promise<CodigoCid[]> {
    this.cid$ ??= firstValueFrom(this.http.get<CodigoCid[]>(URL_CID)).catch(erro => {
      this.cid$ = undefined;
      throw erro;
    });
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
