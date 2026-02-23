import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { Subject, takeUntil } from 'rxjs';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { color } from "chart.js/helpers";

// Registrar todos os componentes do Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-grafico-agendamentos-dias-semanas-mes',
  templateUrl: './grafico-agendamentos-dias-semanas-mes.component.html',
  styleUrls: ['./grafico-agendamentos-dias-semanas-mes.component.css'],
})
export class GraficoAgendamentosDiasSemanasMesComponent implements OnInit, OnDestroy {
  DatasConsultas: string[] = [];
  TodasConsultas: any[] = [];

  @ViewChild('menuCanvas', { static: true }) elemento: ElementRef | undefined;

  /** Input para forçar filtro por médico específico */
  @Input() medicoId: number | null = null;

  chart: any;
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
    this.fetchConsultas(this.diaSelecionado);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  fetchConsultas(data: number): void {
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
      // Profissional: busca apenas seus agendamentos
      console.log('filtos', idMedicoFiltro, paramentrosBusca, dataFim);
      request$ = this.consultaApiService.pesquisarClinicasEmIntervaloDeDatas(
        idMedicoFiltro, paramentrosBusca, dataFim,"ALL"
      );

    } else if (this.organizacaoId) {
      // Admin de organização: busca agendamentos da organização
      request$ = this.consultaApiService.buscarConsultasPorOrganizacaoEIntervalo(
        this.organizacaoId, paramentrosBusca, dataFim
      );
    } else {
      // Super Admin: busca todos os agendamentos
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
          console.error('Erro ao buscar agendamentos:', error);
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
    console.log('dataInicio', dataInicio)
    console.log('dataFim', dataFim)
    if (!dataInicio || !dataFim) return;

    this.isLoading = true;
    this.hasError = false;
    this.diaSelecionado = 0;

    const DataFimFormatada = dataFim.toISOString().split('T')[0];
    const DataInicioFormatada = dataInicio.toISOString().split('T')[0];
    console.log('DataFimFormatada', DataFimFormatada)
    console.log('DataInicioFormatada', DataInicioFormatada)
    // Determina o ID do médico para filtrar (input ou usuário logado)
    const idMedicoFiltro = this.medicoId || (this.isMedico ? this.usuarioLogadoId : null);

    // Se é médico, busca apenas seus agendamentos
    const request$ = idMedicoFiltro
      ? this.consultaApiService.buscarPorMedicoEIntervalo(
        idMedicoFiltro,
        DataInicioFormatada,
        DataFimFormatada
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
          console.error('Erro ao buscar agendamentos:', error);
          this.hasError = true;
          this.errorMessage = 'Erro ao carregar dados personalizados.';
          this.isLoading = false;
        }
      });
  }

  apurandoDados(): void {
    this.DatasConsultas = [];
    this.TodasConsultas.forEach((consulta) => {
      // Suporta tanto formato novo (dataHora) quanto legado (conData)
      const dataCompleta = consulta.dataHora || consulta.conData;
      if (dataCompleta) {
        // Extrai apenas a data (YYYY-MM-DD) do datetime
        const apenasData = dataCompleta.toString().split('T')[0];
        this.DatasConsultas.push(apenasData);
      }
    });
  }

  criarGrafico(): void {
    if (!this.elemento) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const datasContadas = this.contarConsultasPorData();
    const labels = datasContadas.map((data) => this.formatarData(data.data));
    const quantidadeConsultas = datasContadas.map((data) => data.quantidade);

    this.chart = new Chart(this.elemento.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Agendamentos',
          data: quantidadeConsultas,
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
  formatarData(dataStr: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
    return dataStr;
  }

  contarConsultasPorData(): any[] {
    const counts: { [data: string]: number } = {};
    this.DatasConsultas.forEach((data) => {
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

  // Retorna quantidade de dias únicos com consultas
  getDiasComConsultas(): number {
    const diasUnicos = new Set(this.DatasConsultas);
    return diasUnicos.size;
  }

  atualizarGrafico(): void {
    this.fetchConsultas(this.diaSelecionado);
  }

  atualizarGraficoPersonalizado(): void {
    this.fetchConsultasPersonalizadas();
  }
}
