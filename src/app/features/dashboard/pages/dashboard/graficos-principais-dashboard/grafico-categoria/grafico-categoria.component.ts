import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, finalize, takeUntil } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import {
  EspecialidadeResumo,
  COR_BARRA_QUANTIDADE,
  calcularEspecialidadesCategoria,
  corEspecialidadeCategoria,
} from '../dashboard-calculos';

Chart.register(...registerables);

/** Gráfico "Clínicos por Especialidade" (barras horizontais) da organização do usuário. */
@Component({
  selector: 'app-grafico-categoria',
  templateUrl: './grafico-categoria.component.html',
  styleUrls: ['../graficos-comuns.css', './grafico-categoria.component.css'],
})
export class GraficoCategoriaComponent implements OnInit, OnDestroy {
  @ViewChild('canvasCategoriaMedicos', { static: false }) canvasCategoriaMedicos: ElementRef<HTMLCanvasElement> | undefined;

  chartCategoriaMedicos?: Chart;
  totalClinicos = 0;
  especialidadesCategoria: EspecialidadeResumo[] = [];
  isLoadingCategoria = false;
  hasErrorCategoria = false;

  private destroy$ = new Subject<void>();

  constructor(private facade: DashboardFacade) { }

  ngOnInit(): void {
    this.carregarDadosCategoria();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartCategoriaMedicos) {
      this.chartCategoriaMedicos.destroy();
    }
  }

  private carregarDadosCategoria(): void {
    const profissionais$ = this.facade.profissionaisDaOrganizacao();
    if (!profissionais$) {
      this.hasErrorCategoria = true;
      return;
    }

    this.isLoadingCategoria = true;
    this.hasErrorCategoria = false;

    profissionais$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCategoria = false)
      )
      .subscribe({
        next: (dados: any[]) => {
          this.totalClinicos = dados.length;
          this.especialidadesCategoria = calcularEspecialidadesCategoria(dados);
          this.renderizarGraficoCategoria();
        },
        error: () => {
          this.hasErrorCategoria = true;
        }
      });
  }

  private renderizarGraficoCategoria(): void {
    if (!this.canvasCategoriaMedicos || this.especialidadesCategoria.length === 0) return;
    this.limparGraficoCategoria();

    const labels = this.especialidadesCategoria.map(e => e.nome);
    const data = this.especialidadesCategoria.map(e => e.quantidade);
    // Uma cor só: cada barra é a quantidade de clínicos numa especialidade (magnitude).
    const bgColors = COR_BARRA_QUANTIDADE;
    const maxVal = Math.max(...data, 1);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 0,
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
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
    return corEspecialidadeCategoria(index);
  }
}
