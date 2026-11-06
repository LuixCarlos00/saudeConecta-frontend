import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Subject, finalize, takeUntil } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import {
  contarAgendamentosPorData,
  extrairDatasAgendamentos,
  formatarDataAgendamentos,
} from '../dashboard-calculos';

Chart.register(...registerables);

/** Gráfico "Agendamentos por Dia/Semana/Mês" (linha), com filtros de 7/30/60 dias e intervalo livre. */
@Component({
  selector: 'app-grafico-agendamentos',
  templateUrl: './grafico-agendamentos.component.html',
  styleUrls: ['../graficos-comuns.css', '../graficos-filtros.css', '../graficos-estados.css'],
})
export class GraficoAgendamentosComponent implements OnInit, OnDestroy {
  /** ID do médico para filtrar os dados (opcional) */
  @Input() medicoId: number | null = null;

  @ViewChild('canvasAgendamentos', { static: false }) canvasAgendamentos: ElementRef | undefined;

  chartAgendamentos: any;
  DatasAgendamentos: string[] = [];
  TodasAgendamentos: any[] = [];

  diaSelecionadoAgendamentos = 1;
  isLoadingAgendamentos = false;
  hasErrorAgendamentos = false;
  errorMessageAgendamentos = '';

  IntervaloDeDatasAgendamentos!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private facade: DashboardFacade,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.IntervaloDeDatasAgendamentos = this.formBuilder.group({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });

    this.fetchAgendamentosPadronizados(this.diaSelecionadoAgendamentos);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartAgendamentos) {
      this.chartAgendamentos.destroy();
    }
  }

  fetchAgendamentosPadronizados(data: number): void {
    this.isLoadingAgendamentos = true;
    this.hasErrorAgendamentos = false;
    this.errorMessageAgendamentos = '';

    this.facade.agendamentosPadronizados(data, this.medicoId)
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

    if (dataInicio > dataFim) {
      this.hasErrorAgendamentos = true;
      this.errorMessageAgendamentos = 'A data inicial não pode ser maior que a data final.';
      return;
    }

    this.isLoadingAgendamentos = true;
    this.hasErrorAgendamentos = false;
    this.diaSelecionadoAgendamentos = 0;

    this.facade.agendamentosPersonalizados(dataInicio, dataFim, this.medicoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingAgendamentos = false)
      )
      .subscribe({
        next: (dados) => {
          this.TodasAgendamentos = dados || [];
          this.apurandoDadosAgendamentos();
          this.criarGraficoAgendamentos();
        },
        error: (error) => {
          console.error('Erro ao buscar agendamentos:', error);
          this.hasErrorAgendamentos = true;
          this.errorMessageAgendamentos = 'Erro ao carregar dados personalizados.';
        }
      });
  }

  apurandoDadosAgendamentos(): void {
    this.DatasAgendamentos = extrairDatasAgendamentos(this.TodasAgendamentos);
  }

  criarGraficoAgendamentos(): void {
    if (!this.canvasAgendamentos) return;

    if (this.chartAgendamentos) {
      this.chartAgendamentos.destroy();
    }

    const datasContadas = contarAgendamentosPorData(this.DatasAgendamentos);
    const labels = datasContadas.map((data) => formatarDataAgendamentos(data.data));
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

  atualizarGraficoAgendamentos(): void {
    this.fetchAgendamentosPadronizados(this.diaSelecionadoAgendamentos);
  }

  atualizarGraficoAgendamentosPersonalizado(): void {
    this.fetchAgendamentosPersonalizados();
  }
}
