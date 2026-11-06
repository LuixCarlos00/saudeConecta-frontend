import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Subject, finalize, takeUntil } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import {
  LARGURA_BARRA_PADRAO,
  contarConsultasPorEspecialidade,
  extrairDatasConsultas,
} from '../dashboard-calculos';

Chart.register(...registerables);

/** Gráfico "Consultas por Período" (barras por especialidade), com filtros de 7/30/60 dias e intervalo livre. */
@Component({
  selector: 'app-grafico-consultas',
  templateUrl: './grafico-consultas.component.html',
  styleUrls: ['../graficos-comuns.css', '../graficos-filtros.css', '../graficos-estados.css'],
})
export class GraficoConsultasComponent implements OnInit, OnDestroy {
  /** ID do médico para filtrar os dados (opcional) */
  @Input() medicoId: number | null = null;

  @ViewChild('canvasConsultas', { static: false }) canvasConsultas: ElementRef | undefined;

  chartConsultas: any;
  DatasConsultas: string[] = [];
  TodasConsultas: any[] = [];

  diaSelecionadoConsultas = 1;
  isLoadingConsultas = false;
  hasErrorConsultas = false;
  errorMessageConsultas = '';

  IntervaloDeDatasConsultas!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private facade: DashboardFacade,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.IntervaloDeDatasConsultas = this.formBuilder.group({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });

    this.fetchConsultasPadronizadas(this.diaSelecionadoConsultas);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartConsultas) {
      this.chartConsultas.destroy();
    }
  }

  fetchConsultasPadronizadas(data: number): void {
    this.isLoadingConsultas = true;
    this.hasErrorConsultas = false;
    this.errorMessageConsultas = '';

    this.facade.consultasPadronizadas(data, this.medicoId)
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

    if (dataInicio > dataFim) {
      this.hasErrorConsultas = true;
      this.errorMessageConsultas = 'A data inicial não pode ser maior que a data final.';
      return;
    }

    this.isLoadingConsultas = true;
    this.hasErrorConsultas = false;
    this.diaSelecionadoConsultas = 0;

    this.facade.consultasPersonalizadas(dataInicio, dataFim, this.medicoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingConsultas = false)
      )
      .subscribe({
        next: (dados) => {
          this.TodasConsultas = dados || [];
          this.apurandoDadosConsultas();
          this.criarGraficoConsultas();
        },
        error: (error) => {
          console.error('Erro ao buscar consultas:', error);
          this.hasErrorConsultas = true;
          this.errorMessageConsultas = 'Erro ao carregar dados personalizados.';
        }
      });
  }

  apurandoDadosConsultas(): void {
    this.DatasConsultas = extrairDatasConsultas(this.TodasConsultas);
  }

  criarGraficoConsultas(): void {
    if (!this.canvasConsultas) return;

    if (this.chartConsultas) {
      this.chartConsultas.destroy();
    }

    const dadosPorEspecialidade = contarConsultasPorEspecialidade(this.TodasConsultas);
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
          barPercentage: LARGURA_BARRA_PADRAO.barPercentage,
          categoryPercentage: LARGURA_BARRA_PADRAO.categoryPercentage,
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

  atualizarGraficoConsultas(): void {
    this.fetchConsultasPadronizadas(this.diaSelecionadoConsultas);
  }

  atualizarGraficoConsultasPersonalizado(): void {
    this.fetchConsultasPersonalizadas();
  }
}
