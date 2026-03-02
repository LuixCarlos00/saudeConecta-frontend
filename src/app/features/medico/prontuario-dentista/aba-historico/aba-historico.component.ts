import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';

@Component({
  selector: 'app-aba-historico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aba-historico.component.html',
  styleUrl: '../prontuario-dentista.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaHistoricoComponent implements OnChanges, OnDestroy {

  @Input() pacienteId: number | undefined;

  historicoProntuarios: any[] = [];
  historicoCarregado = false;
  historicoLoading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(private prontuarioDentistaApi: ProntuarioDentistaApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && this.pacienteId) {
      this.carregarHistoricoPaciente(this.pacienteId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarHistoricoPaciente(pacienteId: number): void {
    this.historicoLoading = true;
    this.prontuarioDentistaApi.listarHistoricoPorPaciente(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => {
          this.historicoProntuarios = lista || [];
          this.historicoCarregado = true;
          this.historicoLoading = false;
        },
        error: () => {
          this.historicoProntuarios = [];
          this.historicoCarregado = true;
          this.historicoLoading = false;
        }
      });
  }

  calcularTotalPlanejamentos(planejamentos: any[]): number {
    if (!planejamentos || planejamentos.length === 0) return 0;
    return planejamentos.reduce((sum: number, item: any) => sum + (item.valor || 0), 0);
  }

  formatarOdontograma(dentes: any[]): string {
    if (!dentes || dentes.length === 0) return '';
    return dentes.map(d => {
      let texto = `Dente ${d.numeroFdi}: ${d.status}`;
      if (d.observacao) texto += ` — ${d.observacao}`;
      return texto;
    }).join('; ');
  }
}
