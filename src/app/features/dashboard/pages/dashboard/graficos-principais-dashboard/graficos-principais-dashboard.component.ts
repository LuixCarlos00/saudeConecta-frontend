import { Component, Input } from '@angular/core';

/**
 * Grid que agrupa os gráficos principais do dashboard. Cada gráfico é um componente filho
 * (consultas, agendamentos, saldo, categoria e tempo médio) que busca os próprios dados pelo
 * DashboardFacade; aqui só se decide quais aparecem.
 *
 * A exibição de cada gráfico é controlada por @Input, permitindo que o componente pai decida
 * quais gráficos exibir (ex.: com base no tipo de usuário logado, através de
 * TipoGraficoDashboard/isGraficoAtivo). O filho só é criado (e só busca dados) quando o seu
 * flag liga, inclusive se o flag mudar de false para true depois do carregamento inicial.
 */
@Component({
  selector: 'app-graficos-principais-dashboard',
  templateUrl: './graficos-principais-dashboard.component.html',
  styleUrls: ['./graficos-principais-dashboard.component.css'],
})
export class GraficosPrincipaisDashboardComponent {
  /** Controla a exibição do gráfico de Consultas por Período */
  @Input() exibirConsultasPorPeriodo = true;

  /** Controla a exibição do gráfico de Agendamentos por Dia/Semana/Mês */
  @Input() exibirAgendamentos = true;

  /** Controla a exibição do gráfico de Saldo Financeiro */
  @Input() exibirSaldoFinanceiro = false;

  /** Controla a exibição do gráfico de Clínicos por Especialidade */
  @Input() exibirMedicosPorEspecialidade = false;

  /** Controla a exibição do gráfico de Média de Tempo de Consulta */
  @Input() exibirMediaTempoConsulta = false;

  /** ID do médico para filtrar os dados dos gráficos (opcional) */
  @Input() medicoId: number | null = null;
}
