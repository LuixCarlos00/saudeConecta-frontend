import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from 'src/app/core/auth/auth.service';
import { ConsultaApiService, SaldoFinanceiroResponse } from 'src/app/core/data-access/consulta-api.service';
import { ControleAcessoApiService } from 'src/app/core/data-access/controle-acesso-api.service';
import { ProfissionalApiService } from 'src/app/core/data-access/profissional-api.service';
import { formatarDataLocal } from 'src/app/shared/utils/data-local';
import {
  PeriodoEnumMediaTempo,
  PeriodoFiltroSaldo,
  agruparSaldoPor,
  calcularIntervaloMediaTempo,
  calcularIntervaloPadronizado,
  calcularIntervaloSaldo,
} from '../pages/dashboard/graficos-principais-dashboard/dashboard-calculos';

/**
 * Porta de entrada dos dados dos gráficos do dashboard. Decide, pelo perfil do usuário logado,
 * qual rota chamar (profissional vê só o que é dele, admin de organização vê a organização,
 * super admin vê tudo), para que os componentes dos gráficos só cuidem de tela.
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  constructor(
    private consultaApi: ConsultaApiService,
    private controleAcesso: ControleAcessoApiService,
    private auth: AuthService,
    private profissionalApi: ProfissionalApiService
  ) { }

  /** ID do usuário logado, ou null se não houver. */
  usuarioId(): number | null {
    return this.auth.getCurrentUser()?.id || null;
  }

  /** O usuário logado tem acesso de médico (profissional)? */
  temAcessoMedico(): boolean {
    return this.controleAcesso.AcessoMedico();
  }

  /** O usuário logado pertence a uma organização? */
  temOrganizacao(): boolean {
    return !!this.organizacaoId();
  }

  /**
   * Consultas dos filtros rápidos (7/30/60 dias) conforme o perfil.
   *
   * @param opcao 1 = 7 dias, 2 = 30 dias, 3 = 60 dias
   * @param medicoId médico escolhido pela tela (opcional); sem ele, vale o próprio logado se for profissional
   */
  consultasPadronizadas(opcao: number, medicoId: number | null): Observable<any[]> {
    const { inicio, fim } = calcularIntervaloPadronizado(opcao, new Date());
    const idMedico = this.idMedicoFiltro(medicoId);
    const organizacaoId = this.organizacaoId();

    if (idMedico) {
      return this.consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas(inicio, fim, idMedico);
    }
    if (organizacaoId) {
      return this.consultaApi.buscarConsultasPorOrganizacaoEIntervalo(organizacaoId, inicio, fim);
    }
    return this.consultaApi.buscarPorIntervaloDeDatas(inicio, fim);
  }

  /** Consultas de um intervalo escolhido pelo usuário (profissional ou geral; não filtra por organização). */
  consultasPersonalizadas(inicio: Date, fim: Date, medicoId: number | null): Observable<any[]> {
    const idMedico = this.idMedicoFiltro(medicoId);
    const dataInicio = formatarDataLocal(inicio);
    const dataFim = formatarDataLocal(fim);

    return idMedico
      ? this.consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas(dataInicio, dataFim, idMedico)
      : this.consultaApi.buscarPorIntervaloDeDatas(dataInicio, dataFim);
  }

  /** Agendamentos dos filtros rápidos (7/30/60 dias) conforme o perfil. */
  agendamentosPadronizados(opcao: number, medicoId: number | null): Observable<any[]> {
    const { inicio, fim } = calcularIntervaloPadronizado(opcao, new Date());
    const idMedico = this.idMedicoFiltro(medicoId);
    const organizacaoId = this.organizacaoId();

    if (idMedico) {
      return this.consultaApi.pesquisarClinicasEmIntervaloDeDatas(idMedico, inicio, fim);
    }
    if (organizacaoId) {
      return this.consultaApi.buscarConsultasPorOrganizacaoEIntervalo(organizacaoId, inicio, fim);
    }
    return this.consultaApi.buscarPorIntervaloDeDatas(inicio, fim);
  }

  /** Agendamentos de um intervalo escolhido pelo usuário (profissional ou geral; não filtra por organização). */
  agendamentosPersonalizados(inicio: Date, fim: Date, medicoId: number | null): Observable<any[]> {
    const idMedico = this.idMedicoFiltro(medicoId);
    const dataInicio = formatarDataLocal(inicio);
    const dataFim = formatarDataLocal(fim);

    return idMedico
      ? this.consultaApi.pesquisarClinicasEmIntervaloDeDatas(idMedico, dataInicio, dataFim)
      : this.consultaApi.buscarPorIntervaloDeDatas(dataInicio, dataFim);
  }

  /** Saldo financeiro do período (por semana em "este mês", por mês nos demais). */
  saldo(periodo: PeriodoFiltroSaldo): Observable<SaldoFinanceiroResponse> {
    const { inicio, fim } = calcularIntervaloSaldo(periodo, new Date());
    return this.consultaApi.getSaldoFinanceiro(inicio, fim, agruparSaldoPor(periodo));
  }

  /** Profissionais da organização do usuário, ou null se ele não tiver organização. */
  profissionaisDaOrganizacao(): Observable<any[]> | null {
    const organizacaoId = this.organizacaoId();
    return organizacaoId ? this.profissionalApi.buscarPorOrganizacao(organizacaoId) : null;
  }

  /** Durações (min) das consultas do usuário logado num período, ou null se não houver usuário. */
  duracoesDasConsultas(periodo: PeriodoEnumMediaTempo): Observable<number[]> | null {
    const { inicio, fim } = calcularIntervaloMediaTempo(periodo, new Date());
    return this.duracoesNoIntervalo(inicio, fim);
  }

  /** Durações (min) das consultas do usuário logado entre duas datas locais (yyyy-MM-dd). */
  duracoesNoIntervalo(inicio: string, fim: string): Observable<number[]> | null {
    const usuarioId = this.usuarioId();
    return usuarioId ? this.consultaApi.buscarDuracoesConsultas(usuarioId, inicio, fim) : null;
  }

  private organizacaoId(): number | null {
    return this.auth.getCurrentUser()?.organizacaoId || null;
  }

  /** Médico da tela (@Input) ou, se o logado é só profissional, ele mesmo; senão null. */
  private idMedicoFiltro(medicoId: number | null): number | null {
    const logadoProfissional = this.controleAcesso.isDashboardProfissional() ? this.usuarioId() : null;
    return medicoId || logadoProfissional;
  }
}
