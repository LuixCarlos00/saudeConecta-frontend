import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';

@Component({
  selector: 'app-aba-identificacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aba-identificacao.component.html',
  styleUrl: '../prontuario-dentista.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaIdentificacaoComponent implements OnChanges, OnDestroy {

  @Input() pacienteId: number | undefined;

  dadosPaciente: any = null;
  pacienteLoading = false;

  responsavel = '';
  inicioTratamento = '';
  terminoTratamento = '';
  interrupcao = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private pacienteApi: PacienteApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && this.pacienteId) {
      this.carregarDadosPaciente(this.pacienteId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarDadosPaciente(pacienteId: number): void {
    this.pacienteLoading = true;
    this.pacienteApi.buscarrPacientebyOrg(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paciente) => {
          this.dadosPaciente = paciente;
          this.pacienteLoading = false;
        },
        error: () => { this.pacienteLoading = false; }
      });
  }

  /**
   * Preenche os campos da aba com dados existentes (modo edição).
   * @param dados Objeto com os campos do prontuário
   */
  setDados(dados: any): void {
    if (!dados) return;
    this.responsavel = dados.responsavel || '';
    this.inicioTratamento = dados.inicioTratamento || '';
    this.terminoTratamento = dados.terminoTratamento || '';
    this.interrupcao = dados.interrupcao || '';
  }

  /**
   * Retorna os dados da aba para composição do payload de finalização.
   */
  getDados(): any {
    return {
      responsavel: this.responsavel,
      inicioTratamento: this.inicioTratamento || null,
      terminoTratamento: this.terminoTratamento || null,
      interrupcao: this.interrupcao,
    };
  }
}
