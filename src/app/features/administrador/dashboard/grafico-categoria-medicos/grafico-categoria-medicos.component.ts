import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

Chart.register(...registerables);

interface EspecialidadeResumo {
  nome: string;
  quantidade: number;
  percentual: number;
}

@Component({
  selector: 'app-grafico-categoria-medicos',
  templateUrl: './grafico-categoria-medicos.component.html',
  styleUrls: ['./grafico-categoria-medicos.component.css']
})
export class GraficoCategoriaMedicosComponent implements OnInit, OnDestroy {

  @ViewChild('especialidadeCanvas', { static: true }) canvasRef?: ElementRef<HTMLCanvasElement>;

  chart?: Chart;
  totalClinicos = 0;
  especialidades: EspecialidadeResumo[] = [];
  isLoading = false;
  hasError = false;

  private organizacaoId: number | null = null;
  private readonly destroy$ = new Subject<void>();

  private readonly PALETA_CORES: readonly string[] = [
    'rgba(59, 130, 246, 0.75)',
    'rgba(16, 185, 129, 0.75)',
    'rgba(245, 158, 11, 0.75)',
    'rgba(239, 68, 68, 0.75)',
    'rgba(139, 92, 246, 0.75)',
    'rgba(236, 72, 153, 0.75)',
    'rgba(6, 182, 212, 0.75)',
    'rgba(249, 115, 22, 0.75)',
    'rgba(34, 197, 94, 0.75)',
    'rgba(99, 102, 241, 0.75)',
    'rgba(168, 85, 247, 0.75)',
    'rgba(14, 165, 233, 0.75)'
  ];

  private readonly PALETA_BORDAS: readonly string[] = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(6, 182, 212, 1)',
    'rgba(249, 115, 22, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(99, 102, 241, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(14, 165, 233, 1)'
  ];

  constructor(
    private profissionalApiService: ProfissionalApiService,
    private tokenService: tokenService
  ) {}

  ngOnInit(): void {
    this.tokenService.decodificaToken();
    const usuario = this.tokenService.getUsuarioLogado();
    if (usuario) {
      this.organizacaoId = usuario.organizacaoId || null;
    }
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.limparGrafico();
  }

  private carregarDados(): void {
    if (!this.organizacaoId) {
      this.hasError = true;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.profissionalApiService.buscarPorOrganizacao(this.organizacaoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (dados: any[]) => {
          this.totalClinicos = dados.length;
          this.processarEspecialidades(dados);
          this.renderizarGrafico();
        },
        error: () => {
          this.hasError = true;
        }
      });
  }

  private processarEspecialidades(profissionais: any[]): void {
    const contagem = new Map<string, number>();

    profissionais.forEach(prof => {
      const esp = this.getEspecialidadePrincipal(prof);
      contagem.set(esp, (contagem.get(esp) || 0) + 1);
    });

    this.especialidades = Array.from(contagem.entries())
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
        percentual: this.totalClinicos > 0 ? Math.round((quantidade / this.totalClinicos) * 100) : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  private getEspecialidadePrincipal(medico: any): string {
    if (medico.especialidades && medico.especialidades.length > 0) {
      return medico.especialidades[0].nome;
    }
    if (medico.medEspecialidade) {
      return medico.medEspecialidade.toString();
    }
    return 'Não informado';
  }

  private renderizarGrafico(): void {
    if (!this.canvasRef || this.especialidades.length === 0) return;
    this.limparGrafico();

    const labels = this.especialidades.map(e => e.nome);
    const data = this.especialidades.map(e => e.quantidade);
    const bgColors = this.especialidades.map((_, i) => this.PALETA_CORES[i % this.PALETA_CORES.length]);
    const borderColors = this.especialidades.map((_, i) => this.PALETA_BORDAS[i % this.PALETA_BORDAS.length]);
    const maxVal = Math.max(...data, 1);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 18
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

    this.chart = new Chart(this.canvasRef.nativeElement, config);
  }

  private limparGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  getCorEspecialidade(index: number): string {
    return this.PALETA_CORES[index % this.PALETA_CORES.length];
  }
}
