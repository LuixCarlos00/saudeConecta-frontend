import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Observable, Subject, finalize, takeUntil } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { formatarDataLocal } from 'src/app/shared/utils/data-local';
import {
  LARGURA_BARRA_PADRAO,
  MediaTempoConsulta,
  PeriodoEnumMediaTempo,
  calcularEstatisticasMediaTempo,
  formatarTempo,
  validarIntervaloMediaTempo,
} from '../dashboard-calculos';

Chart.register(...registerables);

/** Gráfico "Média de Tempo de Consulta" (barras mínimo/média/máximo) do médico logado. */
@Component({
  selector: 'app-grafico-media-tempo',
  templateUrl: './grafico-media-tempo.component.html',
  styleUrls: ['../graficos-comuns.css', '../graficos-filtros.css', './grafico-media-tempo.component.css'],
})
export class GraficoMediaTempoComponent implements OnInit, OnDestroy {
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

  private destroy$ = new Subject<void>();

  constructor(
    private facade: DashboardFacade,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.IntervaloDeDatasMediaTempo = this.formBuilder.group({
      start: new FormControl<Date | null>(null, Validators.required),
      end: new FormControl<Date | null>(null, Validators.required),
    });

    this.verificarAcessoECarregarDados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartMediaTempo) {
      this.chartMediaTempo.destroy();
    }
  }

  private verificarAcessoECarregarDados(): void {
    if (!this.facade.temAcessoMedico()) {
      this.hasErrorMediaTempo = true;
      this.errorMessageMediaTempo = 'Acesso restrito a médicos.';
      return;
    }

    if (!this.facade.usuarioId()) {
      this.hasErrorMediaTempo = true;
      this.errorMessageMediaTempo = 'Usuário não identificado.';
      return;
    }

    this.fetchDadosMediaTempo(this.diaSelecionadoMediaTempo);
  }

  fetchDadosMediaTempo(periodo: PeriodoEnumMediaTempo): void {
    this.buscarMediaTempo(this.facade.duracoesDasConsultas(periodo));
  }

  private buscarMediaTempo(duracoes$: Observable<number[]> | null): void {
    if (!duracoes$) {
      console.warn('ID do usuário não disponível');
      return;
    }

    this.isLoadingMediaTempo = true;
    this.hasErrorMediaTempo = false;
    this.errorMessageMediaTempo = '';

    duracoes$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingMediaTempo = false)
      )
      .subscribe({
        next: (duracoes) => this.handleSucessoMediaTempo(duracoes),
        error: (error) => this.handleErroMediaTempo(error, 'Erro ao carregar durações de consultas')
      });
  }

  private handleSucessoMediaTempo(duracoes: number[]): void {
    this.dadosMediaTempo = calcularEstatisticasMediaTempo(duracoes);
    this.criarGraficoMediaTempo();
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

    const erro = validarIntervaloMediaTempo(dataInicio, dataFim);
    if (erro) {
      this.errorMessageMediaTempo = erro;
      this.hasErrorMediaTempo = true;
      return;
    }

    this.diaSelecionadoMediaTempo = PeriodoEnumMediaTempo.PERSONALIZADO;

    this.buscarMediaTempo(this.facade.duracoesNoIntervalo(formatarDataLocal(dataInicio), formatarDataLocal(dataFim)));
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
          barPercentage: LARGURA_BARRA_PADRAO.barPercentage,
          categoryPercentage: LARGURA_BARRA_PADRAO.categoryPercentage,
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
    return formatarTempo(minutos);
  }

  temDadosMediaTempo(): boolean {
    return this.dadosMediaTempo.totalConsultas > 0;
  }
}
