import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

Chart.register(...registerables);

enum StatusConsultaEnum {
  AGENDADA = 0,
  REALIZADA = 1,
  CANCELADA = 2,
  NAO_COMPARECEU = 3
}

enum PeriodoEnum {
  SETE_DIAS = 1,
  TRINTA_DIAS = 2,
  SESSENTA_DIAS = 3,
  PERSONALIZADO = 0
}

interface StatusConsulta {
  status: StatusConsultaEnum;
  quantidade: number;
  label: string;
  cor: string;
}

interface StatusConfig {
  label: string;
  cor: string;
}

@Component({
  selector: 'app-grafico-consultas-por-status',
  templateUrl: './grafico-consultas-por-status.component.html',
  styleUrls: ['./grafico-consultas-por-status.component.css'],
})
export class GraficoConsultasPorStatusComponent implements OnInit, OnDestroy {
  @ViewChild('statusCanvas', { static: true }) elemento?: ElementRef<HTMLCanvasElement>;

  chart?: Chart;
  dadosStatus: StatusConsulta[] = [];
  totalConsultas = 0;

  diaSelecionado: PeriodoEnum = PeriodoEnum.SETE_DIAS;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private usuarioLogadoId = 0;
  private isMedico = false;

  IntervaloDeDatas!: FormGroup;
  private readonly destroy$ = new Subject<void>();

  private readonly STATUS_MAP: Readonly<Record<StatusConsultaEnum, StatusConfig>> = {
    [StatusConsultaEnum.AGENDADA]: { label: 'Agendada', cor: 'rgba(59, 130, 246, 0.8)' },
    [StatusConsultaEnum.REALIZADA]: { label: 'Realizada', cor: 'rgba(16, 185, 129, 0.8)' },
    [StatusConsultaEnum.CANCELADA]: { label: 'Cancelada', cor: 'rgba(239, 68, 68, 0.8)' },
    [StatusConsultaEnum.NAO_COMPARECEU]: { label: 'Não Compareceu', cor: 'rgba(245, 158, 11, 0.8)' }
  };

  private readonly DIAS_POR_PERIODO: Readonly<Record<PeriodoEnum, number>> = {
    [PeriodoEnum.SETE_DIAS]: 7,
    [PeriodoEnum.TRINTA_DIAS]: 30,
    [PeriodoEnum.SESSENTA_DIAS]: 60,
    [PeriodoEnum.PERSONALIZADO]: 0
  };

  constructor(
    private consultaApiService: ConsultaApiService,
    private formBuilder: FormBuilder,
    private controleAcessoService: ControleAcessoApiService,
    private tokenService: tokenService
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.verificarAcessoECarregarDados();
  }

  private inicializarFormulario(): void {
    this.IntervaloDeDatas = this.formBuilder.group({
      start: new FormControl<Date | null>(null, Validators.required),
      end: new FormControl<Date | null>(null, Validators.required),
    });
  }

  private verificarAcessoECarregarDados(): void {
    this.isMedico = this.controleAcessoService.AcessoMedico();

    if (!this.isMedico) {
      this.hasError = true;
      this.errorMessage = 'Acesso restrito a médicos.';
      return;
    }

    this.tokenService.decodificaToken();
    const usuario = this.tokenService.getUsuarioLogado();

    if (!usuario?.id) {
      this.hasError = true;
      this.errorMessage = 'Usuário não identificado.';
      return;
    }

    this.usuarioLogadoId = usuario.id;
    this.fetchDados(this.diaSelecionado);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  fetchDados(periodo: PeriodoEnum): void {
    if (!this.usuarioLogadoId) {
      console.warn('ID do usuário não disponível');
      return;
    }

    const { dataInicio, dataFim } = this.calcularIntervaloData(periodo);
    this.buscarEstatisticas(dataInicio, dataFim);
  }

  private calcularIntervaloData(periodo: PeriodoEnum): { dataInicio: string; dataFim: string } {
    const dataFim = new Date();
    const dataInicio = new Date();

    const diasSubtrair = this.DIAS_POR_PERIODO[periodo];
    if (diasSubtrair > 0) {
      dataInicio.setDate(dataInicio.getDate() - diasSubtrair);
    }

    return {
      dataInicio: this.formatarData(dataInicio),
      dataFim: this.formatarData(dataFim)
    };
  }

  private formatarData(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  private buscarEstatisticas(dataInicio: string, dataFim: string): void {
    this.iniciarCarregamento();

    this.consultaApiService
      .buscarEstatisticasPorMedicoEStatus(this.usuarioLogadoId, dataInicio, dataFim)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (dados) => this.handleSucesso(dados),
        error: (error) => this.handleErro(error, 'Erro ao carregar dados de status')
      });
  }

  private iniciarCarregamento(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
  }

  private handleSucesso(dados: any[]): void {
    console.log('dados ', dados)
    this.processarDados(dados || []);
    this.criarGrafico();
  }

  private handleErro(error: any, mensagem: string): void {
    console.error(mensagem, error);
    this.hasError = true;
    this.errorMessage = 'Erro ao carregar dados. Verifique sua conexão.';
    this.dadosStatus = [];
    this.limparGrafico();
  }

  fetchDadosPersonalizados(): void {
    if (!this.IntervaloDeDatas.valid) {
      this.errorMessage = 'Por favor, selecione um intervalo de datas válido.';
      this.hasError = true;
      return;
    }

    const dataInicio = this.IntervaloDeDatas.get('start')?.value as Date;
    const dataFim = this.IntervaloDeDatas.get('end')?.value as Date;

    if (!this.validarIntervaloData(dataInicio, dataFim)) {
      return;
    }

    this.diaSelecionado = PeriodoEnum.PERSONALIZADO;

    const dataInicioFormatada = this.formatarData(dataInicio);
    const dataFimFormatada = this.formatarData(dataFim);

    this.buscarEstatisticas(dataInicioFormatada, dataFimFormatada);
  }

  private validarIntervaloData(dataInicio: Date, dataFim: Date): boolean {
    if (!dataInicio || !dataFim) {
      this.errorMessage = 'Selecione as datas de início e fim.';
      this.hasError = true;
      return false;
    }

    if (dataInicio > dataFim) {
      this.errorMessage = 'A data de início deve ser anterior à data de fim.';
      this.hasError = true;
      return false;
    }

    const diffDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias > 365) {
      this.errorMessage = 'O intervalo não pode ser maior que 365 dias.';
      this.hasError = true;
      return false;
    }

    return true;
  }

  processarDados(dados: any[]): void {
    this.dadosStatus = [];
    this.totalConsultas = 0;

    if (!dados || dados.length === 0) {
      return;
    }

    dados.forEach((item) => {
      if (!Array.isArray(item) || item.length < 2) {
        console.warn('Item de dados inválido:', item);
        return;
      }

      const status = item[0] as StatusConsultaEnum ?? StatusConsultaEnum.AGENDADA;
      const quantidade = item[1] ?? 0;

      const statusInfo = this.obterInfoStatus(status);

      this.dadosStatus.push({
        status,
        quantidade,
        label: statusInfo.label,
        cor: statusInfo.cor
      });

      this.totalConsultas += quantidade;
    });

    this.ordenarDadosPorQuantidade();
  }

  private obterInfoStatus(status: StatusConsultaEnum): StatusConfig {
    return this.STATUS_MAP[status] || {
      label: `Status ${status}`,
      cor: 'rgba(148, 163, 184, 0.8)'
    };
  }

  private ordenarDadosPorQuantidade(): void {
    this.dadosStatus.sort((a, b) => b.quantidade - a.quantidade);
  }

  criarGrafico(): void {
    if (!this.elemento?.nativeElement) {
      console.warn('Elemento canvas não disponível');
      return;
    }

    this.limparGrafico();

    if (this.dadosStatus.length === 0) {
      return;
    }

    const config = this.construirConfigGrafico();
    //this.chart = new Chart(this.elemento.nativeElement, config);
  }

  private limparGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private construirConfigGrafico(): ChartConfiguration<'doughnut'> {
    const labels = this.dadosStatus.map(d => d.label);
    const quantidades = this.dadosStatus.map(d => d.quantidade);
    const cores = this.dadosStatus.map(d => d.cor);
    const coresBorda = cores.map(c => c.replace('0.8', '1'));

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: quantidades,
          backgroundColor: cores,
          borderColor: coresBorda,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12, weight: 'bold' },
              color: '#64748b'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => this.formatarTooltip(context)
            }
          }
        },
        cutout: '60%'
      }
    };
  }

  private formatarTooltip(context: any): string {
    const value = context.parsed;
    const percentage = this.calcularPercentual(value);
    return `${context.label}: ${value} (${percentage}%)`;
  }

  private calcularPercentual(valor: number): string {
    if (this.totalConsultas === 0) return '0.0';
    return ((valor / this.totalConsultas) * 100).toFixed(1);
  }

  atualizarGrafico(): void {
    this.fetchDados(this.diaSelecionado);
  }

  atualizarGraficoPersonalizado(): void {
    this.fetchDadosPersonalizados();
  }

  getStatusPrincipal(): string {
    return this.dadosStatus.length > 0 ? this.dadosStatus[0].label : '-';
  }

  getPercentualStatus(quantidade: number): string {
    return this.calcularPercentual(quantidade);
  }

  temDados(): boolean {
    return this.dadosStatus.length > 0 && this.totalConsultas > 0;
  }
}
