import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';

@Component({
  selector: 'app-aba-historico-medico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aba-historico-medico.component.html',
  styleUrl: '../prontuario-shared.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaHistoricoMedicoComponent implements OnChanges, OnDestroy {

  @Input() pacienteId: number | undefined;

  historicoProntuarios: any[] = [];
  historicoCarregado = false;
  historicoLoading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(private prontuarioApi: ProntuarioApiService) {}

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
    this.prontuarioApi.buscarPorPaciente(pacienteId)
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
}
