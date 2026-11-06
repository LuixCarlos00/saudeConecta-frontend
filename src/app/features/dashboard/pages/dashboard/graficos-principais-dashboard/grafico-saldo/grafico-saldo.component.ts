import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, finalize, takeUntil } from 'rxjs';

import { SaldoFinanceiroResponse } from 'src/app/core/data-access/consulta-api.service';
import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { LARGURA_BARRA_PADRAO, PeriodoFiltroSaldo, formatarMoeda } from '../dashboard-calculos';

Chart.register(...registerables);

/** Gráfico "Saldo Financeiro" (barras empilhadas de consultas e procedimentos). */
@Component({
  selector: 'app-grafico-saldo',
  templateUrl: './grafico-saldo.component.html',
  styleUrls: ['../graficos-comuns.css', './grafico-saldo.component.css'],
})
export class GraficoSaldoComponent implements OnInit, OnDestroy {
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

  private destroy$ = new Subject<void>();

  constructor(private facade: DashboardFacade) { }

  ngOnInit(): void {
    this.carregarDadosSaldo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartSaldo) {
      this.chartSaldo.destroy();
    }
  }

  onPeriodoChangeSaldo(periodo: PeriodoFiltroSaldo): void {
    this.periodoSelecionadoSaldo = periodo;
    this.carregarDadosSaldo();
  }

  private carregarDadosSaldo(): void {
    this.isLoadingSaldo = true;
    this.hasErrorSaldo = false;

    this.facade.saldo(this.periodoSelecionadoSaldo)
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
            barPercentage: LARGURA_BARRA_PADRAO.barPercentage,
            categoryPercentage: LARGURA_BARRA_PADRAO.categoryPercentage,
          },
          {
            label: 'Procedimentos',
            data: valoresProcs,
            backgroundColor: this.CORES_SALDO.procedimentos,
            borderColor: this.CORES_SALDO.procedimentosBorder,
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: LARGURA_BARRA_PADRAO.barPercentage,
            categoryPercentage: LARGURA_BARRA_PADRAO.categoryPercentage,
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
    return formatarMoeda(valor);
  }
}
