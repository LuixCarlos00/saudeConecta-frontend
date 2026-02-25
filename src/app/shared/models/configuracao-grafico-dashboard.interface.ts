export enum TipoCardDashboard {
  // AdminOrg
  CONSULTAS_HOJE        = 'CONSULTAS_HOJE',
  CONSULTAS_ATENDIDAS   = 'CONSULTAS_ATENDIDAS',
  CONSULTAS_AGUARDANDO  = 'CONSULTAS_AGUARDANDO',
  MEDICOS_ATIVOS        = 'MEDICOS_ATIVOS',
  CONSULTAS_SEMANA      = 'CONSULTAS_SEMANA',
  CANCELADOS_SEMANA     = 'CANCELADOS_SEMANA',
  CONFIRMADOS_SEMANA    = 'CONFIRMADOS_SEMANA',
}

export enum TipoGraficoDashboard {
  // Gráficos administrativos
  CONSULTAS_POR_PERIODO = 'CONSULTAS_POR_PERIODO',
  AGENDAMENTOS_DIAS_SEMANA = 'AGENDAMENTOS_DIAS_SEMANA',
  SALDO_FINANCEIRO = 'SALDO_FINANCEIRO',
  MEDICOS_POR_ESPECIALIDADE = 'MEDICOS_POR_ESPECIALIDADE',

  // Gráficos do profissional de saúde (médico / dentista)
  MEDIA_TEMPO_CONSULTA = 'MEDIA_TEMPO_CONSULTA',
  AGENDAMENTOS_MEDICO_PERIODO = 'AGENDAMENTOS_MEDICO_PERIODO',
}

export interface ConfiguracaoGraficoDashboard {
  id: number;
  tipoGrafico: TipoGraficoDashboard;
  descricao: string;
  ativo: boolean;
  ordemExibicao: number;
}

export interface AtualizarConfiguracaoGraficoRequest {
  tipoGrafico: TipoGraficoDashboard;
  ativo: boolean;
  ordemExibicao?: number;
}
