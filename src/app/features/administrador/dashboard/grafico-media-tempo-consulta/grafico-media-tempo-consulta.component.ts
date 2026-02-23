import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

Chart.register(...registerables);

enum PeriodoEnum {
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

@Component({
  selector: 'app-grafico-media-tempo-consulta',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule
  ],
  templateUrl: './grafico-media-tempo-consulta.component.html',
  styleUrl: './grafico-media-tempo-consulta.component.css'
})
export class GraficoMediaTempoConsultaComponent implements OnInit, OnDestroy {
  @ViewChild('tempoCanvas', { static: true }) elemento?: ElementRef<HTMLCanvasElement>;

  chart?: Chart;
  dadosMedia: MediaTempoConsulta = {
    mediaTempo: 0,
    totalConsultas: 0,
    tempoMinimo: 0,
    tempoMaximo: 0
  };

  diaSelecionado: PeriodoEnum = PeriodoEnum.SETE_DIAS;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private usuarioLogadoId = 0;
  private isMedico = false;

  IntervaloDeDatas!: FormGroup;
  private readonly destroy$ = new Subject<void>();

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
  console.log('usuario', usuario)
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
    this.buscarMediaTempo(dataInicio, dataFim);
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

  private buscarMediaTempo(dataInicio: string, dataFim: string): void {
    this.iniciarCarregamento();

    this.consultaApiService
      .buscarDuracoesConsultas(this.usuarioLogadoId, dataInicio, dataFim)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (duracoes) => this.handleSucesso(duracoes),
        error: (error) => this.handleErro(error, 'Erro ao carregar durações de consultas')
      });
  }

  private iniciarCarregamento(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
  }

  private handleSucesso(duracoes: number[]): void {
    this.dadosMedia = this.calcularEstatisticas(duracoes);
    this.criarGrafico();
  }

  private calcularEstatisticas(duracoes: number[]): MediaTempoConsulta {
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

  private handleErro(error: any, mensagem: string): void {
    console.error(mensagem, error);
    this.hasError = true;
    this.errorMessage = 'Erro ao carregar dados. Verifique sua conexão.';
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

    this.buscarMediaTempo(dataInicioFormatada, dataFimFormatada);
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

  criarGrafico(): void {
    if (!this.elemento?.nativeElement) {
      console.warn('Elemento canvas não disponível');
      return;
    }

    this.limparGrafico();

    if (this.dadosMedia.totalConsultas === 0) {
      return;
    }

    const config = this.construirConfigGrafico();
    this.chart = new Chart(this.elemento.nativeElement, config);
  }

  private limparGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private construirConfigGrafico(): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: ['Mínimo', 'Média', 'Máximo'],
        datasets: [{
          label: 'Tempo (minutos)',
          data: [
            this.dadosMedia.tempoMinimo,
            this.dadosMedia.mediaTempo,
            this.dadosMedia.tempoMaximo
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
          borderRadius: 8
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

  atualizarGrafico(): void {
    this.fetchDados(this.diaSelecionado);
  }

  atualizarGraficoPersonalizado(): void {
    this.fetchDadosPersonalizados();
  }

  formatarTempo(minutos: number): string {
    if (minutos < 60) {
      return `${minutos.toFixed(0)} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}min`;
  }

  temDados(): boolean {
    return this.dadosMedia.totalConsultas > 0;
  }
}
