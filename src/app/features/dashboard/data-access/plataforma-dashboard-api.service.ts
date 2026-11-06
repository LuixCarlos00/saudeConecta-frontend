import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Status de assinatura devolvidos pelo back (StatusAssinatura). */
export type StatusAssinaturaPlataforma = 'TRIAL' | 'ATIVA' | 'INADIMPLENTE' | 'SUSPENSA' | 'CANCELADA';

/** Motivos pelos quais uma clínica aparece em "Precisa de atenção". */
export type MotivoAtencaoPlataforma = 'PENDENCIA_MANUAL' | 'SUSPENSA' | 'INADIMPLENTE' | 'TRIAL_VENCENDO';

/** Indicadores agregados da plataforma. Valores em R$ (número decimal). */
export interface ResumoPlataforma {
  /** Soma de `porStatus`: clínicas com assinatura (não todas as organizações). */
  clinicasTotal: number;
  clinicasAtivas: number;
  emTrial: number;
  trialsVencendo7Dias: number;
  inadimplentes: number;
  suspensas: number;
  canceladas: number;
  cortesias: number;
  mrr: number;
  receitaMesAtual: number;
  receitaMesAnterior: number;
  ticketMedio: number;
  pendenciasManuais: number;
  usuariosAtivos: number;
  consultasMesAtual: number;
}

export interface QuantidadePorStatus {
  status: StatusAssinaturaPlataforma;
  quantidade: number;
}

export interface ResumoPorPlano {
  plano: string;
  quantidade: number;
  mrr: number;
}

/** Ponto da série mensal; `mes` no formato yyyy-MM. */
export interface PontoSerieMensal {
  mes: string;
  novasClinicas: number;
  cancelamentos: number;
  receitaRecebida: number;
  consultas: number;
}

export interface UsuariosPorPerfil {
  perfil: string;
  quantidade: number;
}

export interface ClinicaUso {
  organizacaoId: number;
  nome: string;
  plano: string;
  status: StatusAssinaturaPlataforma;
  consultasMes: number;
  profissionais: number;
}

/**
 * Item de "Precisa de atenção"; `dataVencimento` no formato yyyy-MM-dd.
 * Em PENDENCIA_MANUAL (evento do Mercado Pago sem clínica identificada) `organizacaoId`, `plano`,
 * `status` e `valorMensal` vêm null e `dataVencimento` é o dia em que o evento chegou.
 */
export interface ClinicaAtencao {
  organizacaoId: number | null;
  nome: string;
  plano: string | null;
  status: StatusAssinaturaPlataforma | null;
  motivo: MotivoAtencaoPlataforma;
  dataVencimento: string | null;
  valorMensal: number | null;
}

/** Resposta de GET /plataforma/dashboard (contrato CONTRATO-DASHBOARD-PLATAFORMA). */
export interface DashboardPlataforma {
  geradoEm: string;
  resumo: ResumoPlataforma;
  porStatus: QuantidadePorStatus[];
  porPlano: ResumoPorPlano[];
  serieMensal: PontoSerieMensal[];
  usuariosPorPerfil: UsuariosPorPerfil[];
  topClinicasUso: ClinicaUso[];
  atencao: ClinicaAtencao[];
}

/** Acesso à rota agregada do dashboard da plataforma (apenas SUPER_ADMIN). */
@Injectable({
  providedIn: 'root'
})
export class PlataformaDashboardApiService {

  private readonly apiUrl = `${environment.apiUrl}/plataforma/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Busca o dashboard da plataforma.
   *
   * @param meses janela das séries mensais (1 a 24; o back assume 12 quando omitido)
   * @returns Observable com o dashboard agregado (422 com code=MESES_INVALIDO se meses fora de 1-24)
   */
  buscar(meses?: number): Observable<DashboardPlataforma> {
    let params = new HttpParams();
    if (meses !== undefined) {
      params = params.set('meses', String(meses));
    }
    return this.http.get<DashboardPlataforma>(this.apiUrl, { params });
  }
}
