import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { Subject, takeUntil } from 'rxjs';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

// Registrar todos os componentes do Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-grafico-qnt-consultas-dia-anterior',
  templateUrl: './grafico-qnt-consultas-dia-anterior.component.html',
  styleUrls: ['./grafico-qnt-consultas-dia-anterior.component.css'],
})
export class GraficoQntConsultasDiaAnteriorComponent implements OnInit, OnDestroy {
  @ViewChild('menuCanvas', { static: true }) elemento: ElementRef | undefined;

  /** Input para forçar filtro por médico específico */
  @Input() medicoId: number | null = null;

  chart: any;

  DatasConsultas: string[] = [];
  TodasConsultas: any[] = [];

  diaSelecionado = 1;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  /** ID do usuário logado */
  private usuarioLogadoId: number = 0;
  /** Indica se o usuário logado é médico */
  private isMedico: boolean = false;
  /** ID da organização do usuário logado */
  private organizacaoId: number | null = null;

  IntervaloDeDatas!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private graficoConsultasPorCategoriaService: ConsultaApiService,
    private consultaApiService: ConsultaApiService,
    private formBuilder: FormBuilder,
    private controleAcessoService: ControleAcessoApiService,
    private tokenService: tokenService
  ) { }

  ngOnInit(): void {
    this.IntervaloDeDatas = this.formBuilder.group({
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

    // Sempre carrega os dados, independente de ser médico ou não
    this.fetchConsultasPadronizadas(this.diaSelecionado);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  fetchConsultasPadronizadas(data: number): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

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
      request$ = this.graficoConsultasPorCategoriaService.BuscandoConsultasPorMedicoEmIntervaloDeDatas(
        paramentrosBusca, dataFim, idMedicoFiltro
      );
    } else if (this.organizacaoId) {
      // Admin de organização: busca consultas da organização
      request$ = this.graficoConsultasPorCategoriaService.buscarConsultasPorOrganizacaoEIntervalo(
        this.organizacaoId, paramentrosBusca, dataFim
      );
    } else {
      // Super Admin: busca todas as consultas
      request$ = this.consultaApiService.buscarPorIntervaloDeDatas(
        paramentrosBusca, dataFim, "ALL"
      );
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.TodasConsultas = dados || [];
          this.apurandoDados();
          this.criarGrafico();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao buscar consultas:', error);
          this.hasError = true;
          this.errorMessage = 'Erro ao carregar dados. Verifique sua conexão.';
          this.isLoading = false;
          this.TodasConsultas = [];
        }
      });
  }

  fetchConsultasPersonalizadas(): void {
    const dataInicio: Date = this.IntervaloDeDatas?.get('start')?.value;
    const dataFim: Date = this.IntervaloDeDatas?.get('end')?.value;

    if (!dataInicio || !dataFim) return;

    this.isLoading = true;
    this.hasError = false;
    this.diaSelecionado = 0;

    const DataFimFormatada = dataFim.toISOString().split('T')[0];
    const DataInicioFormatada = dataInicio.toISOString().split('T')[0];

    // Determina o ID do médico para filtrar (input ou usuário logado)
    const idMedicoFiltro = this.medicoId || (this.isMedico ? this.usuarioLogadoId : null);

    // Se é médico, busca apenas suas consultas
    const request$ = idMedicoFiltro
      ? this.graficoConsultasPorCategoriaService.BuscandoConsultasPorMedicoEmIntervaloDeDatas(
        DataInicioFormatada,
        DataFimFormatada,
        idMedicoFiltro
      )
      : this.consultaApiService.buscarPorIntervaloDeDatas(
        DataInicioFormatada,
        DataFimFormatada,
        "ALL"
      );

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.TodasConsultas = dados || [];
          this.apurandoDados();
          this.criarGrafico();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao buscar consultas:', error);
          this.hasError = true;
          this.errorMessage = 'Erro ao carregar dados personalizados.';
          this.isLoading = false;
        }
      });
  }

  apurandoDados() {
    this.DatasConsultas = [];
    this.TodasConsultas.forEach((consulta) => {
      const data = consulta.dataHora || consulta.conData;
      if (data) {
        this.DatasConsultas.push(data.toString());
      }
    });
  }

  criarGrafico(): void {
    if (!this.elemento) return;

    if (this.chart) {
      this.chart.destroy();
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

    this.chart = new Chart(this.elemento.nativeElement, {
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

  atualizarGrafico(): void {
    this.fetchConsultasPadronizadas(this.diaSelecionado);
  }

  atualizarGraficoPersonalizado(): void {
    this.fetchConsultasPersonalizadas();
  }
}
