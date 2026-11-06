import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Status de assinatura aceitos no filtro de `GET /assinaturas`. */
export type StatusAssinaturaFiltro = 'TRIAL' | 'ATIVA' | 'INADIMPLENTE' | 'SUSPENSA' | 'CANCELADA';

/** Tipo do plano base aceito no filtro de `GET /assinaturas`. */
export type TipoPlanoFiltro = 'STARTER' | 'PROFISSIONAL' | 'BUSINESS';

/** Campos de ordenação aceitos pelo back (outro valor dá 400 REQUISICAO_INVALIDA). */
export type CampoOrdenacaoAssinatura =
  'organizacaoNome' | 'status' | 'plano' | 'valorMensal' | 'dataVencimento' | 'criadoEm';

/** Filtros, paginação e ordenação da listagem do SUPER_ADMIN (contrato admin-assinaturas, seção 2). */
export interface FiltroAssinaturasAdmin {
  status?: StatusAssinaturaFiltro | '';
  plano?: TipoPlanoFiltro | '';
  cortesia?: boolean | null;
  busca?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/** Linha da listagem: assinatura vigente de uma clínica, sem dado pessoal. */
export interface AssinaturaResumoAdmin {
  assinaturaId: number;
  organizacaoId: number;
  organizacaoNome: string;
  planoId: number;
  planoNome: string;
  planoTipo: string;
  status: StatusAssinaturaFiltro;
  valorMensal: number;
  cortesia: boolean;
  dataVencimento: string | null;
  mpStatus: string | null;
  temPreapproval: boolean;
  preapprovalSubstituidoPendente: boolean;
}

/** Página do Spring Data (só os campos que a tela usa). */
export interface PaginaAssinaturas<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Códigos de motivo das pendências manuais (contrato admin-assinaturas, seção 3.1). */
export type MotivoPendencia =
  'PAGAMENTO_EM_CANCELADA' | 'PAGAMENTO_EM_CORTESIA' | 'PAGAMENTO_SEM_ASSINATURA'
  | 'PREAPPROVAL_SUBSTITUIDO_AUTORIZADO' | 'EVENTO_EXPIRADO';

/** Pendência manual de pagamento (evento de webhook do Mercado Pago que exige ação humana). */
export interface PendenciaManual {
  eventoId: number;
  tipo: string;
  dataId: string | null;
  motivoCodigo: MotivoPendencia | string;
  motivo: string;
  erro: string | null;
  tentativas: number;
  recebidoEm: string;
  expiradoEm: string | null;
  organizacaoId: number | null;
  organizacaoNome: string | null;
  resolvida: boolean;
  resolvidoEm: string | null;
  resolvidoPorUsuarioId: number | null;
  observacaoResolucao: string | null;
}

/**
 * Chamadas exclusivas do SUPER_ADMIN para gerir assinaturas das clínicas e resolver pendências manuais.
 * As ações por linha (cortesia, suspender, cancelar) ficam no AssinaturaApiService.
 */
@Injectable({ providedIn: 'root' })
export class AssinaturaAdminApiService {

  private readonly apiUrl = `${environment.apiUrl}/assinaturas`;

  constructor(private http: HttpClient) { }

  /**
   * Lista paginada da assinatura vigente de cada clínica. Parâmetros vazios não vão na URL.
   *
   * @param filtro status, plano, cortesia, busca, página, tamanho e ordenação
   * @returns Observable com a página de assinaturas
   */
  listar(filtro: FiltroAssinaturasAdmin = {}): Observable<PaginaAssinaturas<AssinaturaResumoAdmin>> {
    let params = new HttpParams();
    if (filtro.status) { params = params.set('status', filtro.status); }
    if (filtro.plano) { params = params.set('plano', filtro.plano); }
    if (filtro.cortesia === true || filtro.cortesia === false) { params = params.set('cortesia', filtro.cortesia); }
    const busca = filtro.busca?.trim();
    if (busca) { params = params.set('busca', busca); }
    if (filtro.page !== undefined) { params = params.set('page', filtro.page); }
    if (filtro.size !== undefined) { params = params.set('size', filtro.size); }
    if (filtro.sort) { params = params.set('sort', filtro.sort); }
    return this.http.get<PaginaAssinaturas<AssinaturaResumoAdmin>>(this.apiUrl, { params });
  }

  /**
   * Lista as pendências manuais, da mais recente para a mais antiga.
   *
   * @param resolvidas false (padrão) lista as abertas; true, as resolvidas
   * @returns Observable com as pendências
   */
  listarPendenciasManuais(resolvidas = false): Observable<PendenciaManual[]> {
    const params = new HttpParams().set('resolvidas', resolvidas);
    return this.http.get<PendenciaManual[]>(`${this.apiUrl}/pendencias-manuais`, { params });
  }

  /**
   * Marca a pendência como resolvida. Não mexe no Mercado Pago: o estorno ou cancelamento
   * é feito no painel do MP antes.
   *
   * @param eventoId id da pendência
   * @param observacao o que foi feito (obrigatória, até 500 caracteres)
   * @returns Observable com a pendência atualizada
   */
  resolverPendencia(eventoId: number, observacao: string): Observable<PendenciaManual> {
    return this.http.patch<PendenciaManual>(`${this.apiUrl}/pendencias-manuais/${eventoId}/resolver`, { observacao });
  }
}
