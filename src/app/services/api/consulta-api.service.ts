import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { environment } from 'src/environments/environment';



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

  // ==========================================
  // STATE MANAGEMENT (migrado de ConsultaService legado)
  // ==========================================
  private dadosFiltradosSubject = new BehaviorSubject<Consultav2[]>([]);
  dadosFiltrados$ = this.dadosFiltradosSubject.asObservable();

  private RecarregarTabelaSubject = new BehaviorSubject<boolean>(false);
  RecarregarTabela$ = this.RecarregarTabelaSubject.asObservable();

  private DeletarDadosDaTabelaSubject = new BehaviorSubject<boolean>(false);
  DeletarDadosDaTabela$ = this.DeletarDadosDaTabelaSubject.asObservable();

  private EditarTabelaSubject = new BehaviorSubject<boolean>(false);
  EditarDadosDaTabela$ = this.EditarTabelaSubject.asObservable();

  private ConcluidoRegistroTabelaSubject = new BehaviorSubject<boolean>(false);
  ConcluidoRegistroTabela$ = this.ConcluidoRegistroTabelaSubject.asObservable();

  private GeraPDFRegistroTabelaSubject = new BehaviorSubject<boolean>(false);
  GeraPDFRegistroTabela$ = this.GeraPDFRegistroTabelaSubject.asObservable();

  private CadastroRealizadoComSucessoSubject = new BehaviorSubject<Consultav2>({} as Consultav2);
  CadastroRealizadoComSucesso$ = this.CadastroRealizadoComSucessoSubject.asObservable();

  private DadosParaCronologiaDoDiaSubject = new BehaviorSubject<any>(null);
  BuscarDadoParaCronologia$ = this.DadosParaCronologiaDoDiaSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ==========================================
  // STATE METHODS
  // ==========================================
  FiltraDadosSubject(dados: Consultav2[]): void {
    this.dadosFiltradosSubject.next(dados);
  }

  RecarregarDadosTabelaSubject(dados: boolean): void {
    this.RecarregarTabelaSubject.next(dados);
  }

  ExcluirDadosDaTabelaSubject(dados: boolean): void {
    this.DeletarDadosDaTabelaSubject.next(dados);
  }

  EditarDadosDaTabelaSubject(dados: boolean): void {
    this.EditarTabelaSubject.next(dados);
  }

  ConcluidoTabelaSubject(dados: boolean): void {
    this.ConcluidoRegistroTabelaSubject.next(dados);
  }

  Gera_PDF_DeRegistroDaTabelaSubject(dados: boolean): void {
    this.GeraPDFRegistroTabelaSubject.next(dados);
  }

  PassarDadosParaCronologiaDoDia(dados: any): void {
    this.DadosParaCronologiaDoDiaSubject.next(dados);
  }

  ChangeCadastroRealizadoComSucesso(cadastro: Consultav2): void {
    this.CadastroRealizadoComSucessoSubject.next(cadastro);
  }

  // ==========================================
  // CRUD BÁSICO
  // ==========================================


  atualizarConsultabyOrg(id: number, consulta: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/atualizarConsultabyOrg/${id}`, consulta);
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

  pesquisarPorEspecialidadeEOrganizacao(especialidade: string, organizacaoId: number, status?: string): Observable<Consultav2[]> {
    const especialidadeEncoded = encodeURIComponent(especialidade);
    let url = `${this.apiUrl}/organizacao/${organizacaoId}/especialidade/${especialidadeEncoded}`;

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

  confirmarConsulta(id: number): Observable<Consultav2> {
    return this.http.patch<Consultav2>(`${this.apiUrl}/${id}/status?status=CONFIRMADA`, {});
  }

  cancelarConsulta(id: number, motivo: string): Observable<Consultav2> {
    return this.http.patch<Consultav2>(
      `${this.apiUrl}/${id}/status?status=CANCELADA&motivo=${encodeURIComponent(motivo)}`, {}
    );
  }


  verificarDisponibilidadeByOrg(data: string, horario: string, medicoId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/verificarDisponibilidade?horario=${horario}&data=${data}&medicoId=${medicoId}`
    );
  }



  cadastrarConsultaByOrg(consultav2: Consultav2): Observable<Consultav2> {
    return this.http.post<Consultav2>(`${this.apiUrl}/cadastrarConsultaByOrg`, consultav2);
  }


  BuscandoHistoricoDeConsultasDoPaciente(codigoID: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/BuscandoHistoricoDeConsultasDoPaciente/${codigoID}`);
  }


  BuscandoHistoricoDeConsultasDoPaciente_dentista(pacienteId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/BuscandoHistoricoDeConsultasDoPaciente_dentista/${pacienteId}`);
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

  // buscarTodas(): Observable<Consultav2[]> {
  //   return this.http.get<Consultav2[]>(`${this.apiUrl}/listarTodos`);
  // }

  // buscarPorId(id: number): Observable<Consultav2> {
  //   return this.http.get<Consultav2>(`${this.apiUrl}/buscarId/${id}`);
  // }


  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  // ==========================================
  // CONSULTAv2S POR PERÍODO
  // ==========================================

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

  // ==========================================
  // CONSULTAv2S POR MÉDICO (URLs corrigidas)
  // ==========================================

  buscarPorMedico(medicoId: number): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/buscarPorMedico/${medicoId}`);
  }

  // ==========================================
  // CONSULTAv2S POR INTERVALO DE DATAS (URLs corrigidas)
  // ==========================================



  // buscarPorIntervaloDeDatasConcluidas(dataInicio: string, dataFim: string): Observable<Consultav2[]> {
  //   return this.http.get<Consultav2[]>(
  //     `${this.apiUrl}/intervalo/concluidas?dataInicial=${dataInicio}&dataFinal=${dataFim}`
  //   );
  // }


  buscarPorEspecialidade(especialidade: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/buscarPorEspecialidade/${especialidade}`);
  }

  buscarPorMedicoEIntervalo(medicoId: number, dataInicio: string, dataFim: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/profissional/${medicoId}/intervalo?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }

  buscarAgendaTodosMedicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listarTodos`);
  }

  // ==========================================
  // CONSULTAv2S CONCLUÍDAS - MÉTODOS REMOVIDOS
  // ==========================================
  // URLs não existem mais no backend.
  // Use buscarTodas() + filtro por status="CONCLUIDA" no frontend

  // ==========================================
  // AGENDA DO MÉDICO
  // ==========================================

  /**
   * Busca consultas de um médico por período
   * O backend calcula automaticamente o intervalo de datas baseado no tipo de período
   *
   * @param idUsuarioMedico ID do usuário do profissional
   * @param tipoPeriodo Tipo do período: 'diario', 'semanal', 'mensal', 'anual' (padrão: 'diario')
   * @returns Observable com lista de consultas do médico no período especificado
   */
  buscarAgendaMedico(idUsuarioMedico: number, tipoPeriodo: string = 'diario'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agenda-medico/${idUsuarioMedico}`, {
      params: { tipoPeriodo }
    });
  }

  buscarHistoricoMedico(idUsuarioMedico: number): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(`${this.apiUrl}/historico-medico/${idUsuarioMedico}`);
  }

  // buscarAgendaTodosMedicos - REMOVIDO (duplicação de buscarTodas)

  // ==========================================
  // VERIFICAÇÕES E HORÁRIOS
  // ==========================================



  // ==========================================
  // ESTATÍSTICAS (URLs corrigidas)
  // ==========================================

  buscarEstatisticasConsultasHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-hoje`);
  }

  buscarEstatisticasRealizadasHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-realizadas-hoje`);
  }

  buscarEstatisticasAgendadasHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-agendadas-hoje`);
  }

  buscarEstatisticasSemana(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-semana`);
  }

  buscarEstatisticasSemanaPorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/consultas-semana?medicoId=${usuarioId}`);
  }

  buscarEstatisticasMedicosAtivos(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/profissionais/estatisticas/medicos-ativos`);
  }




















  // ==========================================
  // ESTATÍSTICAS POR PROFISSIONAL (usuarioId + orgId via TenantContext)
  // ==========================================

  buscarEstatisticasConsultasHojePorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/profissional/${usuarioId}/consultas-hoje`);
  }

  buscarEstatisticasRealizadasHojePorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/profissional/${usuarioId}/consultas-realizadas-hoje`);
  }

  buscarEstatisticasAgendadasHojePorProfissional(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/profissional/${usuarioId}/consultas-agendadas-hoje`);
  }

  // ==========================================
  // ESTATÍSTICAS POR ORGANIZAÇÃO
  // ==========================================

  buscarEstatisticasConsultasHojePorOrganizacao(organizacaoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/organizacao/${organizacaoId}/consultas-hoje`);
  }

  buscarEstatisticasRealizadasHojePorOrganizacao(organizacaoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/organizacao/${organizacaoId}/consultas-realizadas-hoje`);
  }

  buscarEstatisticasAgendadasHojePorOrganizacao(organizacaoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/organizacao/${organizacaoId}/consultas-agendadas-hoje`);
  }

  buscarEstatisticasSemanaPorOrganizacao(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/organizacao/${usuarioId}/consultas-semana`);
  }


  buscarEstatisticasMedicosAtivosPorOrganizacao(organizacaoId: number): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/profissionais/estatisticas/organizacao/${organizacaoId}/medicos-ativos`);
  } // Todo verificar  /profssionar  se pode tirar

  // ==========================================
  // CONSULTAS POR ORGANIZAÇÃO
  // ==========================================

  buscarConsultasPorOrganizacaoEIntervalo(organizacaoId: number, dataInicio: string, dataFim: string): Observable<Consultav2[]> {
    return this.http.get<Consultav2[]>(
      `${this.apiUrl}/organizacao/${organizacaoId}/intervalo?dataInicial=${dataInicio}&dataFinal=${dataFim}`
    );
  }

  // ==========================================
  // MÉTODOS LEGADOS (migrados de CronologiaService)
  // ==========================================




  BuscandoTodasConsultasPorMedico(medicoId: number): Observable<Consultav2[]> {
    return this.buscarPorMedico(medicoId);
  }





  // BuscandoTodasConsultasPorMedicoEspecialidadeEmIntervaloDeDatas(medicoId: number, especialidade: string, dataInicio: string, dataFim: string): Observable<any[]> {
  //   return this.buscarEstatisticasPorMedicoEIntervalo(medicoId, dataInicio, dataFim);
  // }

  // Consultas concluídas (usam mesmos endpoints, filtrar por status no frontend)



  BuscandoTodasConsultas_Concluidas_PorMedico(medicoId: number): Observable<Consultav2[]> {
    return this.buscarPorMedico(medicoId);
  }






  // BuscandoTodasConsultas_Concluidas_PorMedicoEspecialidadeEmIntervaloDeDatas(medicoId: number, especialidade: string, dataInicio: string, dataFim: string): Observable<any[]> {
  //   return this.buscarEstatisticasPorMedicoEIntervalo(medicoId, dataInicio, dataFim);
  // }

  // ==========================================
  // MÉTODOS LEGADOS (migrados de GraficoConsultasPorCategoriasService)
  // ==========================================

  BuscandoConsultasPorMedicoEmIntervaloDeDatas(dataInicio: string, dataFim: string, medicoId: number): Observable<any[]> {
    return this.buscarEstatisticasPorMedicoEIntervalo(medicoId, dataInicio, dataFim);
  }

  // ContarConsultasPorStatusMedico(medicoId: number, dataInicio: string, dataFim: string): Observable<any[]> {
  //   return this.buscarEstatisticasPorMedicoEIntervalo(medicoId, dataInicio, dataFim);
  // }

  // // ==========================================
  // // MÉTODOS LEGADOS (migrados de GraficoAgendamentoDiaService)
  // // ==========================================

  // BuscandoAgendamentosPorMedicoEmIntervaloDeDatas(dataInicio: string, dataFim: string, medicoId: number): Observable<any[]> {
  //   return this.buscarEstatisticasPorMedicoEIntervalo(medicoId, dataInicio, dataFim);
  // }

  // ==========================================
  // MÉTODOS LEGADOS (migrados de ConsultaService)
  // ==========================================



  // VericarSeExetemConsultasMarcadas(consult: Consulta): Observable<any> {
  //   return this.http.get<any>(
  //     `${this.apiUrl}/verificar-disponibilidade/data=${consult.conData}&horario=${consult.conHorario}&medico=${consult.conMedico}`
  //   );
  // }

  // BuscarTodosRegistrosDeConsulta(): Observable<Consulta[]> {
  //   return this.buscarTodas();
  // }

  // BuscarConsultasDoDiaAtual(): Observable<Consulta[]> {
  //   return this.buscarDoDiaAtual();
  // }

  // BuscarConsultasDaSemanaAtual(): Observable<Consulta[]> {
  //   return this.buscarDaSemanaAtual();
  // }

  // BuscarConsultasDoMesAtual(): Observable<Consulta[]> {
  //   return this.buscarDoMesAtual();
  // }

  // BuscarConsultasDoAnoAtual(): Observable<Consulta[]> {
  //   return this.buscarDoAnoAtual();
  // }






  // VerificarHorariosDisponiveisReferentesAoMedicoEData(medCodigo: number, DataSelecionada: string): Observable<string[]> {
  //   return this.buscarHorariosOcupadosByOrg(medCodigo, DataSelecionada);
  // }

  // BuscarEstatisticasConsultasHoje(): Observable<number> {
  //   return this.buscarEstatisticasConsultasHoje();
  // }

  // BuscarEstatisticasConsultasRealizadasHoje(): Observable<number> {
  //   return this.buscarEstatisticasRealizadasHoje();
  // }

  // BuscarEstatisticasConsultasAgendadasHoje(): Observable<number> {
  //   return this.buscarEstatisticasAgendadasHoje();
  // }

  // BuscarEstatisticasConsultasSemana(): Observable<number> {
  //   return this.buscarEstatisticasSemana();
  // }

  // BuscarEstatisticasMedicosAtivos(): Observable<number> {
  //   return this.buscarEstatisticasMedicosAtivos();
  // }

  // ==========================================
  // FILTRO DE DADOS (migrado de ConsultaService)
  // ==========================================

  // filtrandoDadosDoBancoPassadoParametros_Pesquisa(dados: any, dataSource: Tabela[]): Promise<Tabela[]> {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const normalizeString = (str: string) => {
  //         return str
  //           .normalize('NFD')
  //           .replace(/[\u0300-\u036f]/g, '')
  //           .toUpperCase();
  //       };

  //       const safeNormalize = (value: any) => {
  //         return value ? normalizeString(value.toString()) : '';
  //       };

  //       const isDateMatch = (date1: string, date2: string) => {
  //         const parseDate = (dateStr: string) => {
  //           const date = new Date(dateStr);
  //           return isNaN(date.getTime()) ? null : date;
  //         };

  //         const parsedDate1 = parseDate(date1);
  //         const parsedDate2 = parseDate(date2);

  //         if (!parsedDate1 || !parsedDate2) {
  //           return false;
  //         }

  //         return (
  //           parsedDate1.toISOString().split('T')[0] ===
  //           parsedDate2.toISOString().split('T')[0]
  //         );
  //       };

  //       const isTimeMatch = (time1: string, time2: string) => {
  //         const formatTime = (time: string) => {
  //           let [hour, minute] = time.split(':');
  //           if (!hour || !minute) {
  //             return null;
  //           }
  //           hour = hour.padStart(2, '0');
  //           minute = minute.padStart(2, '0');
  //           return `${hour}:${minute}`;
  //         };

  //         const formattedTime1 = formatTime(time1.trim());
  //         const formattedTime2 = formatTime(time2.trim());

  //         if (!formattedTime1 || !formattedTime2) {
  //           return false;
  //         }

  //         return formattedTime1 === formattedTime2;
  //       };

  //       const dadosUpper = safeNormalize(dados.trim());

  //       let resultadoFiltrado = dataSource.filter(
  //         (item) =>
  //           safeNormalize(item.consulta).includes(dadosUpper) ||
  //           safeNormalize(item.medico?.medNome).includes(dadosUpper) ||
  //           safeNormalize(item.paciente?.PaciNome).includes(dadosUpper) ||
  //           safeNormalize(item.diaSemana).includes(dadosUpper) ||
  //           isDateMatch(item.data, dados.trim()) ||
  //           isTimeMatch(item.horario, dados.trim()) ||
  //           safeNormalize(item.observacao).includes(dadosUpper)
  //       );

  //       if (resultadoFiltrado.length > 0) {
  //         resolve(resultadoFiltrado);
  //       } else {
  //         resolve([]);
  //       }
  //     } catch (error) {
  //       console.error('Erro ao filtrar dados:', error);
  //       reject(error);
  //     }
  //   });
  // }

  // // ==========================================
  // MÉTODOS LEGADOS (migrados de TabelaAgendaMedicoService)
  // ==========================================


  // BuscarConsultasDoDiaAtualPorMedico(medicoId: number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/dia-atual/medico/${medicoId}`);
  // }

  // BuscarConsultasDaSemanaAtualPorMedico(medicoId: number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/semana-atual/medico/${medicoId}`);
  // }

  // BuscarConsultasDoMesAtualPorMedico(medicoId: number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/mes-atual/medico/${medicoId}`);
  // }

  // BuscarConsultasDoAnoAtualPorMedico(medicoId: number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/ano-atual/medico/${medicoId}`);
  // }
}
