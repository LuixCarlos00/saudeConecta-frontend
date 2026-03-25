import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { environment } from 'src/environments/environment';
import { EstatisticasDashboardAdminOrg } from './dashboard-api.service';



export interface ConsultaEstatisticas {
  consultasHoje: number;
  consultasRealizadasHoje: number;
  consultasAgendadasHoje: number;
  consultasSemana: number;
  medicosAtivos: number;
}

export interface Tabela {
  consulta: any;
  medico: any;
  paciente: any;
  diaSemana: string;
  data: string;
  horario: string;
  observacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultaApiService {

  private readonly apiUrl = `${environment.apiUrl}/consultas`;

  constructor(private http: HttpClient) { }





  atualizarConsultabyOrg(id: number, consulta: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/atualizarConsultabyOrg/${id}`, consulta);
  }

  /**
   * Busca dinâmica de consultas com filtros opcionais
   * Todos os parâmetros são opcionais
   * 
   * @param profissionalId ID do profissional/médico (opcional)
   * @param especialidade Nome da especialidade (opcional)
   * @param dataInicial Data inicial no formato YYYY-MM-DD (opcional)
   * @param dataFinal Data final no formato YYYY-MM-DD (opcional)
   * @param status Array de status ou string separada por vírgula (opcional)
   * @returns Observable com lista de consultas
   */
  buscarComFiltrosDinamicos(
    profissionalId?: number,
    especialidade?: string,
    dataInicial?: string,
    dataFinal?: string,
    status?: string[] | string
  ): Observable<Consultav2[]> {
    let params: any = {};
    
    if (profissionalId) params.profissionalId = profissionalId;
    if (especialidade) params.especialidade = especialidade;
    if (dataInicial) params.dataInicial = dataInicial;
    if (dataFinal) params.dataFinal = dataFinal;
    
    // Converter array de status para string separada por vírgula
    if (status) {
      params.status = Array.isArray(status) ? status.join(',') : status;
    }
    
    return this.http.get<Consultav2[]>(`${this.apiUrl}/buscar`, { params });
  }

  pesquisarClinicasEmIntervaloDeDatas(medicoId: number, inicio: string, fim: string, status: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/profissional/${medicoId}/intervalo?dataInicial=${inicio}&dataFinal=${fim}&status=${status}`
    );
  }

  buscarPorIntervaloDeDatas(dataInicio: string, dataFim: string, status: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/intervalo?dataInicial=${dataInicio}&dataFinal=${dataFim}&status=${status}`
    );
  }

  pesquisarMedicoEspecialidadeEmIntervaloDeDatas(medicoId: number, especialidade: string, inicio: string, fim: string, status: string): Observable<Consultav2[]> {
    const especialidadeEncoded = encodeURIComponent(especialidade);
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/profissional/${medicoId}/especialidade/intervalo?especialidade=${especialidadeEncoded}&dataInicial=${inicio}&dataFinal=${fim}&status=${status}`
    );
  }

  pesquisarEspecialidadeEmIntervaloDeDatas(inicio: string, fim: string, especialidade: string, status: string): Observable<Consultav2[]> {
    const especialidadeEncoded = encodeURIComponent(especialidade);
    console.log('pesquisando especialidade em intervalo de datas', { inicio, fim, especialidade, status });
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/especialidade/intervalo?especialidade=${especialidadeEncoded}&dataInicial=${inicio}&dataFinal=${fim}&status=${status}`
    );
  }

  pesquisarPorMedicoEEspecialidade(medicoId: number, especialidade: string, status: string): Observable<Consultav2[]> {
    const especialidadeEncoded = encodeURIComponent(especialidade);
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/profissional/${medicoId}/especialidade?especialidade=${especialidadeEncoded}&status=${status}`
    );
  }

  pesquisarPorEspecialidade(especialidade: string, status?: string): Observable<Consultav2[]> {
    const especialidadeEncoded = encodeURIComponent(especialidade);
    let url = `${this.apiUrl}/especialidade/${especialidadeEncoded}`;

    if (status) {
      url += `?status=${status}`;
    }

    return this.http.get<Consultav2[]>(url);
  }


  pesquisarPorProfissional(medicoId: number): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/profissional/${medicoId}`);
  }


  buscarHorariosOcupadosByOrg(medicoId: number, data: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/horarios-ocupados`, { params: { medicoId, data } }
    );
  }

  concluirConsultabyOrg(id: number): Observable<Consultav2> {
    return this.http.put<Consultav2>(`${this.apiUrl}/concluirConsultabyOrg/${id}`, {});
  }

  alterarStatusConsulta(id: number, status: string, motivo?: string): Observable<Consultav2> {
    let url = `${this.apiUrl}/${id}/status?status=${status.toUpperCase()}`;
    if (motivo) {
      url += `&motivo=${encodeURIComponent(motivo)}`;
    }
    return this.http.patch<Consultav2>(url, {});
  }


  verificarDisponibilidadeByOrg(data: string, horario: string, medicoId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/verificarDisponibilidade?horario=${horario}&data=${data}&medicoId=${medicoId}`
    );
  }



  cadastrarConsultaByOrg(consultav2: Consultav2): Observable<Consultav2> {
    return this.http.post<Consultav2>(`${this.apiUrl}/cadastrarConsultaByOrg`, consultav2);
  }

  BuscandoHistoricoDeConsultasDoPaciente(pacienteId: number, tipo: string = 'medico', profissionalId?: number): Observable<any[]> {
    let url = `${this.apiUrl}/BuscandoHistoricoDeConsultasDoPaciente/${pacienteId}?tipo=${tipo}`;
    if (profissionalId) {
      url += `&profissionalId=${profissionalId}`;
    }
    return this.http.get<any[]>(url);
  }

  buscarEstatisticasPorMedicoEIntervalo(medicoId: number, dataInicio: string, dataFim: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/estatisticas/medico/${medicoId}?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }

  buscarEstatisticasPorMedicoEStatus(medicoId: number, dataInicio: string, dataFim: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/estatisticas/medico/${medicoId}?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }

  buscarDuracoesConsultas(medicoId: number, dataInicio: string, dataFim: string): Observable<number[]> {
    return this.http.get<number[]>(
      `${this.apiUrl}/estatisticas/medico/${medicoId}/duracoes?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }

  deletarConsulta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarDoDiaAtual(): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/hoje`);
  }

  buscarDaSemanaAtual(): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/semana-atual`);
  }

  buscarDoMesAtual(): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/mes-atual`);
  }

  buscarDoAnoAtual(): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/ano-atual`);
  }

  buscarPorMedicoEIntervalo(medicoId: number, dataInicio: string, dataFim: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/profissional/${medicoId}/intervalo?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }


  buscarAgendaMedico(idUsuarioMedico: number, tipoPeriodo: string = 'diario'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agenda-medico/${idUsuarioMedico}`, {
      params: { tipoPeriodo }
    });
  }

  buscarEstatisticasConsultasHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-hoje`);
  }

  buscarEstatisticasRealizadasHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-realizadas-hoje`);
  }

  buscarEstatisticasAgendadasHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-agendadas-hoje`);
  }

  buscarEstatisticasSemanaPorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-semana?medicoId=${usuarioId}`);
  }

 
  buscarEstatisticasSemanaGlobal(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-semana-global`);
  }

  buscarEstatisticasMedicosAtivos(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/profissionais/estatisticas/medicos-ativos`);
  }

  buscarEstatisticasConsultasHojePorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/profissional/${usuarioId}/consultas-hoje`);
  }

  buscarEstatisticasRealizadasHojePorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/profissional/${usuarioId}/consultas-realizadas-hoje`);
  }

  buscarEstatisticasAgendadasHojePorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/profissional/${usuarioId}/consultas-agendadas-hoje`);
  }






 
  buscarConsultasPorOrganizacaoEIntervalo(organizacaoId: number, dataInicio: string, dataFim: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/organizacao/${organizacaoId}/intervalo?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }

  BuscandoConsultasPorMedicoEmIntervaloDeDatas(dataInicio: string, dataFim: string, medicoId: number): Observable<any[]> {
    return this.buscarEstatisticasPorMedicoEIntervalo(medicoId, dataInicio, dataFim);
  }


  //=============================================================
  // BUSCAS DE ESTATISTICAS - Dashboard - Admin_ORGANIZACAO
  //=============================================================
  getEstatisticasDashboardAdminOrg(organizacaoId: number): Observable<EstatisticasDashboardAdminOrg> {
    return this.http.get<EstatisticasDashboardAdminOrg>(
      `${this.apiUrl}/estatisticas/organizacao/${organizacaoId}/dashboard`
    );
  }

  //=============================================================
  // SALDO FINANCEIRO - Dashboard
  //=============================================================

  /**
   * Busca estatísticas financeiras (consultas + procedimentos terapêuticos).
   *
   * @param inicio     data de início (yyyy-MM-dd)
   * @param fim        data de fim (yyyy-MM-dd)
   * @param agruparPor "mes" ou "semana"
   * @returns SaldoFinanceiroResponse
   */
  getSaldoFinanceiro(inicio: string, fim: string, agruparPor: string = 'mes'): Observable<SaldoFinanceiroResponse> {
    return this.http.get<SaldoFinanceiroResponse>(
      `${this.apiUrl}/estatisticas/saldo-financeiro`,
      { params: { inicio, fim, agruparPor } }
    );
  }
}

// ── Interfaces de Saldo Financeiro ──────────────────────────

export interface SaldoPorPeriodo {
  periodo: string;
  valorConsultas: number;
  valorProcedimentos: number;
  valorTotal: number;
}

export interface SaldoFinanceiroResponse {
  totalConsultas: number;
  totalProcedimentos: number;
  totalGeral: number;
  quantidadeConsultas: number;
  quantidadeProcedimentos: number;
  detalhamento: SaldoPorPeriodo[];
}