import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ConsultaApiService, SaldoFinanceiroResponse } from 'src/app/services/api/consulta-api.service';

Chart.register(...registerables);

enum PeriodoFiltro {
  ESTE_MES = 'ESTE_MES',
  ULTIMOS_3_MESES = 'ULTIMOS_3_MESES',
  ULTIMOS_6_MESES = 'ULTIMOS_6_MESES',
  ESTE_ANO = 'ESTE_ANO'
}

@Component({
  selector: 'app-grafico-saldo',
  templateUrl: './grafico-saldo.component.html',
  styleUrls: ['./grafico-saldo.component.css']
})
export class GraficoSaldoComponent implements OnInit, OnDestroy {

  @ViewChild('saldoCanvas', { static: true }) canvasRef?: ElementRef<HTMLCanvasElement>;

  chart?: Chart;
  dados?: SaldoFinanceiroResponse;

  periodoSelecionado: PeriodoFiltro = PeriodoFiltro.ULTIMOS_3_MESES;
  readonly PeriodoFiltro = PeriodoFiltro;

  isLoading = false;
  hasError = false;

  private readonly destroy$ = new Subject<void>();

  private readonly CORES = {
    consultas: 'rgba(59, 130, 246, 0.75)',
    consultasBorder: 'rgba(59, 130, 246, 1)',
    procedimentos: 'rgba(16, 185, 129, 0.75)',
    procedimentosBorder: 'rgba(16, 185, 129, 1)'
  };

  constructor(private consultaApiService: ConsultaApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.limparGrafico();
  }

  onPeriodoChange(periodo: PeriodoFiltro): void {
    this.periodoSelecionado = periodo;
    this.carregarDados();
  }

  private carregarDados(): void {
    this.isLoading = true;
    this.hasError = false;

    const { inicio, fim } = this.calcularIntervalo();
    const agruparPor = this.periodoSelecionado === PeriodoFiltro.ESTE_MES ? 'semana' : 'mes';

    this.consultaApiService.getSaldoFinanceiro(inicio, fim, agruparPor)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.dados = response;
          this.renderizarGrafico();
        },
        error: () => {
          this.hasError = true;
        }
      });
  }

  private calcularIntervalo(): { inicio: string; fim: string } {
    const hoje = new Date();
    let inicio: Date;

    switch (this.periodoSelecionado) {
      case PeriodoFiltro.ESTE_MES:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case PeriodoFiltro.ULTIMOS_3_MESES:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        break;
      case PeriodoFiltro.ULTIMOS_6_MESES:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
        break;
      case PeriodoFiltro.ESTE_ANO:
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }

    return {
      inicio: this.formatarData(inicio),
      fim: this.formatarData(hoje)
    };
  }

  private formatarData(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private renderizarGrafico(): void {
    if (!this.canvasRef || !this.dados) return;
    this.limparGrafico();

    const labels = this.dados.detalhamento.map(d => d.periodo);
    const valoresConsultas = this.dados.detalhamento.map(d => d.valorConsultas);
    const valoresProcs = this.dados.detalhamento.map(d => d.valorProcedimentos);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Consultas',
            data: valoresConsultas,
            backgroundColor: this.CORES.consultas,
            borderColor: this.CORES.consultasBorder,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Procedimentos',
            data: valoresProcs,
            backgroundColor: this.CORES.procedimentos,
            borderColor: this.CORES.procedimentosBorder,
            borderWidth: 1,
            borderRadius: 4
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

    this.chart = new Chart(this.canvasRef.nativeElement, config);
  }

  private limparGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  formatarMoeda(valor: number): string {
    return 'R$ ' + (valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
