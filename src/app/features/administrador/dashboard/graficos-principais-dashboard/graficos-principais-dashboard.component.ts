import { Component, ElementRef, OnInit, ViewChild, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { ConsultaApiService, SaldoFinanceiroResponse } from 'src/app/services/api/consulta-api.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';

// Registrar todos os componentes do Chart.js
Chart.register(...registerables);

enum PeriodoFiltroSaldo {
  ESTE_MES = 'ESTE_MES',
  ULTIMOS_3_MESES = 'ULTIMOS_3_MESES',
  ULTIMOS_6_MESES = 'ULTIMOS_6_MESES',
  ESTE_ANO = 'ESTE_ANO'
}

interface EspecialidadeResumo {
  nome: string;
  quantidade: number;
  percentual: number;
}

enum PeriodoEnumMediaTempo {
  SETE_DIAS = 1,
  TRINTA_DIAS = 2,
  SESSENTA_DIAS = 3,
  PERSONALIZADO = 0
}

interface MediaTempoConsulta {
  mediaTempo: number;
  totalConsultas: number;
  tempoMinimo: number;
  tempoMaximo: number;
}

/**
 * Componente unificado que agrupa os gráficos principais do dashboard
 * (Consultas por Período e Agendamentos por Dia), com o código bruto
 * (HTML/CSS/lógica) de cada gráfico embutido diretamente neste componente.
 *
 * Pode ser reutilizado em qualquer parte da aplicação. A exibição de cada
 * gráfico é controlada por @Input, permitindo que o componente pai decida
 * quais gráficos exibir (ex.: com base no tipo de usuário logado, através
 * de TipoGraficoDashboard/isGraficoAtivo).
 */
@Component({
  selector: 'app-graficos-principais-dashboard',
  templateUrl: './graficos-principais-dashboard.component.html',
  styleUrls: ['./graficos-principais-dashboard.component.css'],
})
export class GraficosPrincipaisDashboardComponent implements OnInit, OnChanges, OnDestroy {
 
  private readonly LARGURA_BARRA_PADRAO = {
    barPercentage: 0.5,
    categoryPercentage: 0.6,
  };

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

  // ===========================================================================
  // GRÁFICO: CONSULTAS POR PERÍODO (barras por especialidade)
  // ===========================================================================
  @ViewChild('canvasConsultas', { static: false }) canvasConsultas: ElementRef | undefined;

  chartConsultas: any;
  DatasConsultas: string[] = [];
  TodasConsultas: any[] = [];

  diaSelecionadoConsultas = 1;
  isLoadingConsultas = false;
  hasErrorConsultas = false;
  errorMessageConsultas = '';

  IntervaloDeDatasConsultas!: FormGroup;

  // ===========================================================================
  // GRÁFICO: AGENDAMENTOS POR DIA/SEMANA/MÊS (linha)
  // ===========================================================================
  @ViewChild('canvasAgendamentos', { static: false }) canvasAgendamentos: ElementRef | undefined;

  chartAgendamentos: any;
  DatasAgendamentos: string[] = [];
  TodasAgendamentos: any[] = [];

  diaSelecionadoAgendamentos = 1;
  isLoadingAgendamentos = false;
  hasErrorAgendamentos = false;
  errorMessageAgendamentos = '';

  IntervaloDeDatasAgendamentos!: FormGroup;

  // ===========================================================================
  // GRÁFICO: SALDO FINANCEIRO (barras empilhadas)
  // ===========================================================================
  @ViewChild('canvasSaldo', { static: false }) canvasSaldo: ElementRef<HTMLCanvasElement> | undefined;

  chartSaldo?: Chart;
  dadosSaldo?: SaldoFinanceiroResponse;
  periodoSelecionadoSaldo: PeriodoFiltroSaldo = PeriodoFiltroSaldo.ULTIMOS_3_MESES;
  readonly PeriodoFiltroSaldo = PeriodoFiltroSaldo;
  isLoadingSaldo = false;
  hasErrorSaldo = false;

  private readonly CORES_SALDO = {
    consultas: 'rgba(59, 130, 246, 0.75)',
    consultasBorder: 'rgba(59, 130, 246, 1)',
    procedimentos: 'rgba(16, 185, 129, 0.75)',
    procedimentosBorder: 'rgba(16, 185, 129, 1)'
  };

  // ===========================================================================
  // GRÁFICO: CLÍNICOS POR ESPECIALIDADE (barras horizontais)
  // ===========================================================================
  @ViewChild('canvasCategoriaMedicos', { static: false }) canvasCategoriaMedicos: ElementRef<HTMLCanvasElement> | undefined;

  chartCategoriaMedicos?: Chart;
  totalClinicos = 0;
  especialidadesCategoria: EspecialidadeResumo[] = [];
  isLoadingCategoria = false;
  hasErrorCategoria = false;

  private readonly PALETA_CORES_CATEGORIA: readonly string[] = [
    'rgba(59, 130, 246, 0.75)',
    'rgba(16, 185, 129, 0.75)',
    'rgba(245, 158, 11, 0.75)',
    'rgba(239, 68, 68, 0.75)',
    'rgba(139, 92, 246, 0.75)',
    'rgba(236, 72, 153, 0.75)',
    'rgba(6, 182, 212, 0.75)',
    'rgba(249, 115, 22, 0.75)',
    'rgba(34, 197, 94, 0.75)',
    'rgba(99, 102, 241, 0.75)',
    'rgba(168, 85, 247, 0.75)',
    'rgba(14, 165, 233, 0.75)'
  ];

  private readonly PALETA_BORDAS_CATEGORIA: readonly string[] = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(6, 182, 212, 1)',
    'rgba(249, 115, 22, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(99, 102, 241, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(14, 165, 233, 1)'
  ];

  // ===========================================================================
  // GRÁFICO: MÉDIA DE TEMPO DE CONSULTA (barras)
  // ===========================================================================
  @ViewChild('canvasMediaTempo', { static: false }) canvasMediaTempo: ElementRef<HTMLCanvasElement> | undefined;

  chartMediaTempo?: Chart;
  dadosMediaTempo: MediaTempoConsulta = {
    mediaTempo: 0,
    totalConsultas: 0,
    tempoMinimo: 0,
    tempoMaximo: 0
  };

  diaSelecionadoMediaTempo: PeriodoEnumMediaTempo = PeriodoEnumMediaTempo.SETE_DIAS;
  isLoadingMediaTempo = false;
  hasErrorMediaTempo = false;
  errorMessageMediaTempo = '';

  IntervaloDeDatasMediaTempo!: FormGroup;

  private readonly DIAS_POR_PERIODO_MEDIA_TEMPO: Readonly<Record<PeriodoEnumMediaTempo, number>> = {
    [PeriodoEnumMediaTempo.SETE_DIAS]: 7,
    [PeriodoEnumMediaTempo.TRINTA_DIAS]: 30,
    [PeriodoEnumMediaTempo.SESSENTA_DIAS]: 60,
    [PeriodoEnumMediaTempo.PERSONALIZADO]: 0
  };

  // ===========================================================================
  // DADOS COMPARTILHADOS DO USUÁRIO LOGADO
  // ===========================================================================

  /** ID do usuário logado */
  private usuarioLogadoId: number = 0;
  /** Indica se o usuário logado é médico */
  private isMedico: boolean = false;
  /** ID da organização do usuário logado */
  private organizacaoId: number | null = null;

  private destroy$ = new Subject<void>();

  /** Controla se os dados iniciais do componente (usuário/organização) já foram carregados */
  private inicializado = false;

  /** Flags de controle para evitar buscas duplicadas quando o @Input muda de valor */
  private consultasCarregadas = false;
  private agendamentosCarregados = false;
  private saldoCarregado = false;
  private categoriaCarregada = false;
  private mediaTempoCarregada = false;

  constructor(
    private consultaApiService: ConsultaApiService,
    private formBuilder: FormBuilder,
    private controleAcessoService: ControleAcessoApiService,
    private tokenService: tokenService,
    private profissionalApiService: ProfissionalApiService
  ) { }

  ngOnInit(): void {
    this.IntervaloDeDatasConsultas = this.formBuilder.group({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });

    this.IntervaloDeDatasAgendamentos = this.formBuilder.group({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });

    // Obtém dados do usuário logado
    this.tokenService.decodificaToken();
    const usuario = this.tokenService.getUsuarioLogado();
    if (usuario) {
      this.usuarioLogadoId = usuario.id;
      this.organizacaoId = usuario.organizacaoId || null;
    }

    // Verifica se é médico (profissional sem ser admin)
    this.isMedico = this.controleAcessoService.isDashboardProfissional();

    this.inicializado = true;

    this.carregarGraficosAtivos();
  }

  /**
   * Reage a mudanças nos @Input de exibição dos gráficos. Isso é necessário
   * porque os flags normalmente dependem de configurações carregadas de forma
   * assíncrona pelo componente pai (ex.: isGraficoAtivo()), que podem mudar de
   * valor (false -> true) DEPOIS que ngOnInit já foi executado. Sem isso, o
   * gráfico ficaria em branco pois os dados nunca seriam buscados.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.inicializado) {
      return;
    }
    this.carregarGraficosAtivos();
  }

  /** Dispara a busca de dados para cada gráfico habilitado que ainda não foi carregado */
  private carregarGraficosAtivos(): void {
    if (this.exibirConsultasPorPeriodo && !this.consultasCarregadas) {
      this.consultasCarregadas = true;
      this.fetchConsultasPadronizadas(this.diaSelecionadoConsultas);
    }

    if (this.exibirAgendamentos && !this.agendamentosCarregados) {
      this.agendamentosCarregados = true;
      this.fetchAgendamentosPadronizados(this.diaSelecionadoAgendamentos);
    }

    if (this.exibirSaldoFinanceiro && !this.saldoCarregado) {
      this.saldoCarregado = true;
      this.carregarDadosSaldo();
    }

    if (this.exibirMedicosPorEspecialidade && !this.categoriaCarregada) {
      this.categoriaCarregada = true;
      this.carregarDadosCategoria();
    }

    if (this.exibirMediaTempoConsulta && !this.mediaTempoCarregada) {
      this.mediaTempoCarregada = true;
      this.inicializarFormularioMediaTempo();
      this.verificarAcessoECarregarDadosMediaTempo();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartConsultas) {
      this.chartConsultas.destroy();
    }
    if (this.chartAgendamentos) {
      this.chartAgendamentos.destroy();
    }
    if (this.chartSaldo) {
      this.chartSaldo.destroy();
    }
    if (this.chartCategoriaMedicos) {
      this.chartCategoriaMedicos.destroy();
    }
    if (this.chartMediaTempo) {
      this.chartMediaTempo.destroy();
    }
  }

  // ===========================================================================
  // MÉTODOS: CONSULTAS POR PERÍODO
  // ===========================================================================

  fetchConsultasPadronizadas(data: number): void {
    this.isLoadingConsultas = true;
    this.hasErrorConsultas = false;
    this.errorMessageConsultas = '';

    let paramentrosBusca: string = '';
    const dateHoje = new Date();
    const date = new Date();

    if (data === 1) {
      date.setDate(date.getDate() - 7);
      paramentrosBusca = date.toISOString().split('T')[0];
    }
    if (data === 2) {
      date.setDate(date.getDate() - 30);
      paramentrosBusca = date.toISOString().split('T')[0];
    }
    if (data === 3) {
      date.setDate(date.getDate() - 60);
      paramentrosBusca = date.toISOString().split('T')[0];
    }

    // Determina o ID do médico para filtrar (input ou usuário logado)
    const idMedicoFiltro = this.medicoId || (this.isMedico ? this.usuarioLogadoId : null);
    const dataFim = dateHoje.toISOString().split('T')[0];

    // Define a requisição baseada no tipo de usuário
    let request$;
    if (idMedicoFiltro) {
      // Profissional: busca apenas suas consultas
      request$ = this.consultaApiService.BuscandoConsultasPorMedicoEmIntervaloDeDatas(
        paramentrosBusca, dataFim, idMedicoFiltro
      );
    } else if (this.organizacaoId) {
      // Admin de organização: busca consultas da organização
      request$ = this.consultaApiService.buscarConsultasPorOrganizacaoEIntervalo(
        this.organizacaoId, paramentrosBusca, dataFim
      );
    } else {
      // Super Admin: busca todas as consultas
      request$ = this.consultaApiService.buscarPorIntervaloDeDatas(
        paramentrosBusca, dataFim
      );
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.TodasConsultas = dados || [];
          this.apurandoDadosConsultas();
          this.criarGraficoConsultas();
          this.isLoadingConsultas = false;
        },
        error: (error) => {
          console.error('Erro ao buscar consultas:', error);
          this.hasErrorConsultas = true;
          this.errorMessageConsultas = 'Erro ao carregar dados. Verifique sua conexão.';
          this.isLoadingConsultas = false;
          this.TodasConsultas = [];
        }
      });
  }

  fetchConsultasPersonalizadas(): void {
    const dataInicio: Date = this.IntervaloDeDatasConsultas?.get('start')?.value;
    const dataFim: Date = this.IntervaloDeDatasConsultas?.get('end')?.value;

    if (!dataInicio || !dataFim) return;

    this.isLoadingConsultas = true;
    this.hasErrorConsultas = false;
    this.diaSelecionadoConsultas = 0;

    const DataFimFormatada = dataFim.toISOString().split('T')[0];
    const DataInicioFormatada = dataInicio.toISOString().split('T')[0];

    // Determina o ID do médico para filtrar (input ou usuário logado)
    const idMedicoFiltro = this.medicoId || (this.isMedico ? this.usuarioLogadoId : null);

    // Se é médico, busca apenas suas consultas
    const request$ = idMedicoFiltro
      ? this.consultaApiService.BuscandoConsultasPorMedicoEmIntervaloDeDatas(
        DataInicioFormatada,
        DataFimFormatada,
        idMedicoFiltro
      )
      : this.consultaApiService.buscarPorIntervaloDeDatas(
        DataInicioFormatada,
        DataFimFormatada
      );

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.TodasConsultas = dados || [];
          this.apurandoDadosConsultas();
          this.criarGraficoConsultas();
          this.isLoadingConsultas = false;
        },
        error: (error) => {
          console.error('Erro ao buscar consultas:', error);
          this.hasErrorConsultas = true;
          this.errorMessageConsultas = 'Erro ao carregar dados personalizados.';
          this.isLoadingConsultas = false;
        }
      });
  }

  apurandoDadosConsultas(): void {
    this.DatasConsultas = [];
    this.TodasConsultas.forEach((consulta) => {
      const data = consulta.dataHora || consulta.conData;
      if (data) {
        this.DatasConsultas.push(data.toString());
      }
    });
  }

  criarGraficoConsultas(): void {
    if (!this.canvasConsultas) return;

    if (this.chartConsultas) {
      this.chartConsultas.destroy();
    }

    const dadosPorEspecialidade = this.contarConsultasPorEspecialidade();
    const labels = dadosPorEspecialidade.map((dados) => dados.especialidade);
    const quantidadeConsultas = dadosPorEspecialidade.map((dados) => dados.quantidade);

    // Cores modernas do Healthcare Design System
    const cores = [
      'rgba(0, 102, 204, 0.8)',   // Primary Blue
      'rgba(16, 185, 129, 0.8)',  // Success Green
      'rgba(245, 158, 11, 0.8)', // Warning Yellow
      'rgba(139, 92, 246, 0.8)', // Purple
      'rgba(236, 72, 153, 0.8)', // Pink
      'rgba(6, 182, 212, 0.8)',  // Cyan
      'rgba(249, 115, 22, 0.8)', // Orange
      'rgba(34, 197, 94, 0.8)',  // Emerald
    ];

    const backgroundColors = labels.map((_, i) => cores[i % cores.length]);
    const borderColors = backgroundColors.map(c => c.replace('0.8', '1'));

    this.chartConsultas = new Chart(this.canvasConsultas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Consultas por Especialidade',
          data: quantidadeConsultas,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: this.LARGURA_BARRA_PADRAO.barPercentage,
          categoryPercentage: this.LARGURA_BARRA_PADRAO.categoryPercentage,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              stepSize: 1,
              color: '#64748b',
              font: { size: 12 },
            },
            title: {
              display: true,
              text: 'Quantidade',
              color: '#334155',
              font: { size: 13, weight: 'bold' as const },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              maxRotation: 45,
              minRotation: 0,
            },
            title: {
              display: true,
              text: 'Especialidade',
              color: '#334155',
              font: { size: 13, weight: 'bold' as const },
            },
          },
        },
      },
    });
  }

  contarConsultasPorEspecialidade(): any[] {
    const counts: { [especialidade: string]: number } = {};

    this.TodasConsultas.forEach((consulta) => {
      const especialidade = consulta.especialidadeNome || consulta.conMedico?.medEspecialidade || 'Não informado';
      if (counts[especialidade]) {
        counts[especialidade]++;
      } else {
        counts[especialidade] = 1;
      }
    });

    return Object.keys(counts).map((especialidade) => ({
      especialidade,
      quantidade: counts[especialidade],
    }));
  }

  // Retorna quantidade de especialidades únicas
  getEspecialidadesCount(): number {
    const especialidades = new Set<string>();
    this.TodasConsultas.forEach((consulta) => {
      const especialidade = consulta.especialidadeNome || consulta.conMedico?.medEspecialidade;
      if (especialidade) {
        especialidades.add(especialidade);
      }
    });
    return especialidades.size;
  }

  atualizarGraficoConsultas(): void {
    this.fetchConsultasPadronizadas(this.diaSelecionadoConsultas);
  }

  atualizarGraficoConsultasPersonalizado(): void {
    this.fetchConsultasPersonalizadas();
  }

  // ===========================================================================
  // MÉTODOS: AGENDAMENTOS POR DIA/SEMANA/MÊS
  // ===========================================================================

  fetchAgendamentosPadronizados(data: number): void {
    this.isLoadingAgendamentos = true;
    this.hasErrorAgendamentos = false;
    this.errorMessageAgendamentos = '';

    let paramentrosBusca: string = '';
    const dateHoje = new Date();
    const date = new Date();

    if (data === 1) {
      date.setDate(date.getDate() - 7);
      paramentrosBusca = date.toISOString().split('T')[0];
    }
    if (data === 2) {
      date.setDate(date.getDate() - 30);
      paramentrosBusca = date.toISOString().split('T')[0];
    }
    if (data === 3) {
      date.setDate(date.getDate() - 60);
      paramentrosBusca = date.toISOString().split('T')[0];
    }

    // Determina o ID do médico para filtrar (input ou usuário logado)
    const idMedicoFiltro = this.medicoId || (this.isMedico ? this.usuarioLogadoId : null);
    const dataFim = dateHoje.toISOString().split('T')[0];

    // Define a requisição baseada no tipo de usuário
    let request$;
    if (idMedicoFiltro) {
      // Profissional: busca apenas seus agendamentos
      request$ = this.consultaApiService.pesquisarClinicasEmIntervaloDeDatas(
        idMedicoFiltro, paramentrosBusca, dataFim
      );
    } else if (this.organizacaoId) {
      // Admin de organização: busca agendamentos da organização
      request$ = this.consultaApiService.buscarConsultasPorOrganizacaoEIntervalo(
        this.organizacaoId, paramentrosBusca, dataFim
      );
    } else {
      // Super Admin: busca todos os agendamentos
      request$ = this.consultaApiService.buscarPorIntervaloDeDatas(
        paramentrosBusca, dataFim
      );
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.TodasAgendamentos = dados || [];
          this.apurandoDadosAgendamentos();
          this.criarGraficoAgendamentos();
          this.isLoadingAgendamentos = false;
        },
        error: (error) => {
          console.error('Erro ao buscar agendamentos:', error);
          this.hasErrorAgendamentos = true;
          this.errorMessageAgendamentos = 'Erro ao carregar dados. Verifique sua conexão.';
          this.isLoadingAgendamentos = false;
          this.TodasAgendamentos = [];
        }
      });
  }

  fetchAgendamentosPersonalizados(): void {
    const dataInicio: Date = this.IntervaloDeDatasAgendamentos?.get('start')?.value;
    const dataFim: Date = this.IntervaloDeDatasAgendamentos?.get('end')?.value;

    if (!dataInicio || !dataFim) return;

    this.isLoadingAgendamentos = true;
    this.hasErrorAgendamentos = false;
    this.diaSelecionadoAgendamentos = 0;

    const DataFimFormatada = dataFim.toISOString().split('T')[0];
    const DataInicioFormatada = dataInicio.toISOString().split('T')[0];

    // Determina o ID do médico para filtrar (input ou usuário logado)
    const idMedicoFiltro = this.medicoId || (this.isMedico ? this.usuarioLogadoId : null);

    // Se é médico, busca apenas seus agendamentos
    const request$ = idMedicoFiltro
      ? this.consultaApiService.pesquisarClinicasEmIntervaloDeDatas(
        idMedicoFiltro,
        DataInicioFormatada,
        DataFimFormatada
      )
      : this.consultaApiService.buscarPorIntervaloDeDatas(
        DataInicioFormatada,
        DataFimFormatada
      );

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.TodasAgendamentos = dados || [];
          this.apurandoDadosAgendamentos();
          this.criarGraficoAgendamentos();
          this.isLoadingAgendamentos = false;
        },
        error: (error) => {
          console.error('Erro ao buscar agendamentos:', error);
          this.hasErrorAgendamentos = true;
          this.errorMessageAgendamentos = 'Erro ao carregar dados personalizados.';
          this.isLoadingAgendamentos = false;
        }
      });
  }

  apurandoDadosAgendamentos(): void {
    this.DatasAgendamentos = [];
    this.TodasAgendamentos.forEach((consulta) => {
      // Suporta tanto formato novo (dataHora) quanto legado (conData)
      const dataCompleta = consulta.dataHora || consulta.conData;
      if (dataCompleta) {
        // Extrai apenas a data (YYYY-MM-DD) do datetime
        const apenasData = dataCompleta.toString().split('T')[0];
        this.DatasAgendamentos.push(apenasData);
      }
    });
  }

  criarGraficoAgendamentos(): void {
    if (!this.canvasAgendamentos) return;

    if (this.chartAgendamentos) {
      this.chartAgendamentos.destroy();
    }

    const datasContadas = this.contarAgendamentosPorData();
    const labels = datasContadas.map((data) => this.formatarDataAgendamentos(data.data));
    const quantidadeAgendamentos = datasContadas.map((data) => data.quantidade);

    this.chartAgendamentos = new Chart(this.canvasAgendamentos.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Agendamentos',
          data: quantidadeAgendamentos,
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          borderColor: '#0066CC',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0066CC',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} consulta(s)`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              stepSize: 1,
              color: '#64748b',
              font: { size: 12 },
            },
            title: {
              display: true,
              text: 'Quantidade',
              color: '#334155',
              font: { size: 13, weight: 'bold' as const },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 0,
            },
            title: {
              display: true,
              text: 'Data',
              color: '#334155',
              font: { size: 13, weight: 'bold' as const },
            },
          },
        },
      },
    });
  }

  // Formata data para exibição (DD/MM)
  formatarDataAgendamentos(dataStr: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
    return dataStr;
  }

  contarAgendamentosPorData(): any[] {
    const counts: { [data: string]: number } = {};
    this.DatasAgendamentos.forEach((data) => {
      counts[data] = counts[data] ? counts[data] + 1 : 1;
    });

    // Ordenar por data
    return Object.keys(counts)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((data) => ({
        data,
        quantidade: counts[data],
      }));
  }

  // Retorna quantidade de dias únicos com agendamentos
  getDiasComAgendamentos(): number {
    const diasUnicos = new Set(this.DatasAgendamentos);
    return diasUnicos.size;
  }

  atualizarGraficoAgendamentos(): void {
    this.fetchAgendamentosPadronizados(this.diaSelecionadoAgendamentos);
  }

  atualizarGraficoAgendamentosPersonalizado(): void {
    this.fetchAgendamentosPersonalizados();
  }

  // ===========================================================================
  // MÉTODOS: SALDO FINANCEIRO
  // ===========================================================================

  onPeriodoChangeSaldo(periodo: PeriodoFiltroSaldo): void {
    this.periodoSelecionadoSaldo = periodo;
    this.carregarDadosSaldo();
  }

  private carregarDadosSaldo(): void {
    this.isLoadingSaldo = true;
    this.hasErrorSaldo = false;

    const { inicio, fim } = this.calcularIntervaloSaldo();
    const agruparPor = this.periodoSelecionadoSaldo === PeriodoFiltroSaldo.ESTE_MES ? 'semana' : 'mes';

    this.consultaApiService.getSaldoFinanceiro(inicio, fim, agruparPor)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSaldo = false)
      )
      .subscribe({
        next: (response) => {
          this.dadosSaldo = response;
          this.renderizarGraficoSaldo();
        },
        error: () => {
          this.hasErrorSaldo = true;
        }
      });
  }

  private calcularIntervaloSaldo(): { inicio: string; fim: string } {
    const hoje = new Date();
    let inicio: Date;

    switch (this.periodoSelecionadoSaldo) {
      case PeriodoFiltroSaldo.ESTE_MES:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case PeriodoFiltroSaldo.ULTIMOS_3_MESES:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        break;
      case PeriodoFiltroSaldo.ULTIMOS_6_MESES:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
        break;
      case PeriodoFiltroSaldo.ESTE_ANO:
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }

    return {
      inicio: this.formatarDataSaldo(inicio),
      fim: this.formatarDataSaldo(hoje)
    };
  }

  private formatarDataSaldo(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private renderizarGraficoSaldo(): void {
    if (!this.canvasSaldo || !this.dadosSaldo) return;
    this.limparGraficoSaldo();

    const labels = this.dadosSaldo.detalhamento.map(d => d.periodo);
    const valoresConsultas = this.dadosSaldo.detalhamento.map(d => d.valorConsultas);
    const valoresProcs = this.dadosSaldo.detalhamento.map(d => d.valorProcedimentos);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Consultas',
            data: valoresConsultas,
            backgroundColor: this.CORES_SALDO.consultas,
            borderColor: this.CORES_SALDO.consultasBorder,
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: this.LARGURA_BARRA_PADRAO.barPercentage,
            categoryPercentage: this.LARGURA_BARRA_PADRAO.categoryPercentage,
          },
          {
            label: 'Procedimentos',
            data: valoresProcs,
            backgroundColor: this.CORES_SALDO.procedimentos,
            borderColor: this.CORES_SALDO.procedimentosBorder,
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: this.LARGURA_BARRA_PADRAO.barPercentage,
            categoryPercentage: this.LARGURA_BARRA_PADRAO.categoryPercentage,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              font: { size: 11 },
              callback: (value) => 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw);
                return `${ctx.dataset.label}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              },
              footer: (items) => {
                const total = items.reduce((s, i) => s + Number(i.raw), 0);
                return `Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        }
      }
    };

    this.chartSaldo = new Chart(this.canvasSaldo.nativeElement, config);
  }

  private limparGraficoSaldo(): void {
    if (this.chartSaldo) {
      this.chartSaldo.destroy();
      this.chartSaldo = undefined;
    }
  }

  formatarMoedaSaldo(valor: number): string {
    return 'R$ ' + (valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ===========================================================================
  // MÉTODOS: CLÍNICOS POR ESPECIALIDADE
  // ===========================================================================

  private carregarDadosCategoria(): void {
    if (!this.organizacaoId) {
      this.hasErrorCategoria = true;
      return;
    }

    this.isLoadingCategoria = true;
    this.hasErrorCategoria = false;

    this.profissionalApiService.buscarPorOrganizacao(this.organizacaoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCategoria = false)
      )
      .subscribe({
        next: (dados: any[]) => {
          this.totalClinicos = dados.length;
          this.processarEspecialidadesCategoria(dados);
          this.renderizarGraficoCategoria();
        },
        error: () => {
          this.hasErrorCategoria = true;
        }
      });
  }

  private processarEspecialidadesCategoria(profissionais: any[]): void {
    const contagem = new Map<string, number>();

    profissionais.forEach(prof => {
      const esp = this.getEspecialidadePrincipalCategoria(prof);
      contagem.set(esp, (contagem.get(esp) || 0) + 1);
    });

    this.especialidadesCategoria = Array.from(contagem.entries())
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
        percentual: this.totalClinicos > 0 ? Math.round((quantidade / this.totalClinicos) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  private getEspecialidadePrincipalCategoria(medico: any): string {
    if (medico.especialidades && medico.especialidades.length > 0) {
      return medico.especialidades[0].nome;
    }
    if (medico.medEspecialidade) {
      return medico.medEspecialidade.toString();
    }
    return 'Não informado';
  }

  private renderizarGraficoCategoria(): void {
    if (!this.canvasCategoriaMedicos || this.especialidadesCategoria.length === 0) return;
    this.limparGraficoCategoria();

    const labels = this.especialidadesCategoria.map(e => e.nome);
    const data = this.especialidadesCategoria.map(e => e.quantidade);
    const bgColors = this.especialidadesCategoria.map((_, i) => this.PALETA_CORES_CATEGORIA[i % this.PALETA_CORES_CATEGORIA.length]);
    const borderColors = this.especialidadesCategoria.map((_, i) => this.PALETA_BORDAS_CATEGORIA[i % this.PALETA_BORDAS_CATEGORIA.length]);
    const maxVal = Math.max(...data, 1);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: this.LARGURA_BARRA_PADRAO.barPercentage,
          categoryPercentage: this.LARGURA_BARRA_PADRAO.categoryPercentage,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: maxVal + Math.ceil(maxVal * 0.15),
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { size: 11 },
              stepSize: 1,
              precision: 0
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 12, weight: 'bold' },
              color: 'var(--text-primary, #333)'
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw);
                const pct = this.totalClinicos > 0 ? Math.round((val / this.totalClinicos) * 100) : 0;
                return ` ${val} clínico${val !== 1 ? 's' : ''} (${pct}%)`;
              }
            }
          }
        }
      }
    };

    this.chartCategoriaMedicos = new Chart(this.canvasCategoriaMedicos.nativeElement, config);
  }

  private limparGraficoCategoria(): void {
    if (this.chartCategoriaMedicos) {
      this.chartCategoriaMedicos.destroy();
      this.chartCategoriaMedicos = undefined;
    }
  }

  getCorEspecialidadeCategoria(index: number): string {
    return this.PALETA_CORES_CATEGORIA[index % this.PALETA_CORES_CATEGORIA.length];
  }

  // ===========================================================================
  // MÉTODOS: MÉDIA DE TEMPO DE CONSULTA
  // ===========================================================================

  private inicializarFormularioMediaTempo(): void {
    this.IntervaloDeDatasMediaTempo = this.formBuilder.group({
      start: new FormControl<Date | null>(null, Validators.required),
      end: new FormControl<Date | null>(null, Validators.required),
    });
  }

  private verificarAcessoECarregarDadosMediaTempo(): void {
    const acessoMedico = this.controleAcessoService.AcessoMedico();

    if (!acessoMedico) {
      this.hasErrorMediaTempo = true;
      this.errorMessageMediaTempo = 'Acesso restrito a médicos.';
      return;
    }

    this.tokenService.decodificaToken();
    const usuario = this.tokenService.getUsuarioLogado();

    if (!usuario?.id) {
      this.hasErrorMediaTempo = true;
      this.errorMessageMediaTempo = 'Usuário não identificado.';
      return;
    }

    this.usuarioLogadoId = usuario.id;

    this.fetchDadosMediaTempo(this.diaSelecionadoMediaTempo);
  }

  fetchDadosMediaTempo(periodo: PeriodoEnumMediaTempo): void {
    if (!this.usuarioLogadoId) {
      console.warn('ID do usuário não disponível');
      return;
    }

    const { dataInicio, dataFim } = this.calcularIntervaloDataMediaTempo(periodo);
    this.buscarMediaTempo(dataInicio, dataFim);
  }

  private calcularIntervaloDataMediaTempo(periodo: PeriodoEnumMediaTempo): { dataInicio: string; dataFim: string } {
    const dataFim = new Date();
    const dataInicio = new Date();

    const diasSubtrair = this.DIAS_POR_PERIODO_MEDIA_TEMPO[periodo];
    if (diasSubtrair > 0) {
      dataInicio.setDate(dataInicio.getDate() - diasSubtrair);
    }

    return {
      dataInicio: this.formatarDataMediaTempo(dataInicio),
      dataFim: this.formatarDataMediaTempo(dataFim)
    };
  }

  private formatarDataMediaTempo(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  private buscarMediaTempo(dataInicio: string, dataFim: string): void {
    this.iniciarCarregamentoMediaTempo();

    this.consultaApiService
      .buscarDuracoesConsultas(this.usuarioLogadoId, dataInicio, dataFim)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingMediaTempo = false)
      )
      .subscribe({
        next: (duracoes) => this.handleSucessoMediaTempo(duracoes),
        error: (error) => this.handleErroMediaTempo(error, 'Erro ao carregar durações de consultas')
      });
  }

  private iniciarCarregamentoMediaTempo(): void {
    this.isLoadingMediaTempo = true;
    this.hasErrorMediaTempo = false;
    this.errorMessageMediaTempo = '';
  }

  private handleSucessoMediaTempo(duracoes: number[]): void {
    this.dadosMediaTempo = this.calcularEstatisticasMediaTempo(duracoes);
    this.criarGraficoMediaTempo();
  }

  private calcularEstatisticasMediaTempo(duracoes: number[]): MediaTempoConsulta {
    if (!duracoes || duracoes.length === 0) {
      return {
        mediaTempo: 0,
        totalConsultas: 0,
        tempoMinimo: 0,
        tempoMaximo: 0
      };
    }

    const soma = duracoes.reduce((acc, val) => acc + val, 0);

    return {
      mediaTempo: Math.round((soma / duracoes.length) * 10) / 10,
      totalConsultas: duracoes.length,
      tempoMinimo: Math.min(...duracoes),
      tempoMaximo: Math.max(...duracoes)
    };
  }

  private handleErroMediaTempo(error: any, mensagem: string): void {
    console.error(mensagem, error);
    this.hasErrorMediaTempo = true;
    this.errorMessageMediaTempo = 'Erro ao carregar dados. Verifique sua conexão.';
    this.limparGraficoMediaTempo();
  }

  fetchDadosPersonalizadosMediaTempo(): void {
    if (!this.IntervaloDeDatasMediaTempo.valid) {
      this.errorMessageMediaTempo = 'Por favor, selecione um intervalo de datas válido.';
      this.hasErrorMediaTempo = true;
      return;
    }

    const dataInicio = this.IntervaloDeDatasMediaTempo.get('start')?.value as Date;
    const dataFim = this.IntervaloDeDatasMediaTempo.get('end')?.value as Date;

    if (!this.validarIntervaloDataMediaTempo(dataInicio, dataFim)) {
      return;
    }

    this.diaSelecionadoMediaTempo = PeriodoEnumMediaTempo.PERSONALIZADO;

    const dataInicioFormatada = this.formatarDataMediaTempo(dataInicio);
    const dataFimFormatada = this.formatarDataMediaTempo(dataFim);

    this.buscarMediaTempo(dataInicioFormatada, dataFimFormatada);
  }

  private validarIntervaloDataMediaTempo(dataInicio: Date, dataFim: Date): boolean {
    if (!dataInicio || !dataFim) {
      this.errorMessageMediaTempo = 'Selecione as datas de início e fim.';
      this.hasErrorMediaTempo = true;
      return false;
    }

    if (dataInicio > dataFim) {
      this.errorMessageMediaTempo = 'A data de início deve ser anterior à data de fim.';
      this.hasErrorMediaTempo = true;
      return false;
    }

    const diffDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias > 365) {
      this.errorMessageMediaTempo = 'O intervalo não pode ser maior que 365 dias.';
      this.hasErrorMediaTempo = true;
      return false;
    }

    return true;
  }

  criarGraficoMediaTempo(): void {
    if (!this.canvasMediaTempo?.nativeElement) {
      console.warn('Elemento canvas não disponível');
      return;
    }

    this.limparGraficoMediaTempo();

    if (this.dadosMediaTempo.totalConsultas === 0) {
      return;
    }

    const config = this.construirConfigGraficoMediaTempo();
    this.chartMediaTempo = new Chart(this.canvasMediaTempo.nativeElement, config);
  }

  private limparGraficoMediaTempo(): void {
    if (this.chartMediaTempo) {
      this.chartMediaTempo.destroy();
      this.chartMediaTempo = undefined;
    }
  }

  private construirConfigGraficoMediaTempo(): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: ['Mínimo', 'Média', 'Máximo'],
        datasets: [{
          label: 'Tempo (minutos)',
          data: [
            this.dadosMediaTempo.tempoMinimo,
            this.dadosMediaTempo.mediaTempo,
            this.dadosMediaTempo.tempoMaximo
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: this.LARGURA_BARRA_PADRAO.barPercentage,
          categoryPercentage: this.LARGURA_BARRA_PADRAO.categoryPercentage,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.y} minutos`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value} min`
            }
          }
        }
      }
    };
  }

  atualizarGraficoMediaTempo(): void {
    this.fetchDadosMediaTempo(this.diaSelecionadoMediaTempo);
  }

  atualizarGraficoPersonalizadoMediaTempo(): void {
    this.fetchDadosPersonalizadosMediaTempo();
  }

  formatarTempoMediaTempo(minutos: number): string {
    if (minutos < 60) {
      return `${minutos.toFixed(0)} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}min`;
  }

  temDadosMediaTempo(): boolean {
    return this.dadosMediaTempo.totalConsultas > 0;
  }
}
