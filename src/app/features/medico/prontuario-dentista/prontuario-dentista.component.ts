import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { Consultav2 } from '../../../util/variados/interfaces/consulta/consultav2';

import {
  Dente,
  DenteStatus,
  DenteStatusOption,
  DentePayload,
  DENTE_STATUS_OPTIONS,
  ProntuarioDentistaRequest,
  getStatusOption,
} from '../../../util/variados/interfaces/Prontuario/ProntuarioDentista';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';

export interface QuadranteConfig {
  id: number;
  label: string;
  dentes: number[];
}

export const QUADRANTES: QuadranteConfig[] = [
  { id: 1, label: 'Q1 · Sup. Direito', dentes: [18, 17, 16, 15, 14, 13, 12, 11] },
  { id: 2, label: 'Q2 · Sup. Esquerdo', dentes: [21, 22, 23, 24, 25, 26, 27, 28] },
  { id: 4, label: 'Q4 · Inf. Direito', dentes: [48, 47, 46, 45, 44, 43, 42, 41] },
  { id: 3, label: 'Q3 · Inf. Esquerdo', dentes: [31, 32, 33, 34, 35, 36, 37, 38] },
];

@Component({
  selector: 'app-prontuario-dentista',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prontuario-dentista.component.html',
  styleUrl: './prontuario-dentista.component.scss',
})
export class ProntuarioDentistaComponent implements OnInit, OnDestroy {

  // =========================================================================
  // ESTADO GERAL
  // =========================================================================
  selectedTabIndex = 0;
  timer = 0;
  minutes = 0;
  seconds = 0;
  interval: ReturnType<typeof setInterval> | null = null;
  Consulta: Consultav2 = {} as Consultav2;
  FinalizarConsulta = false;

  // =========================================================================
  // ANAMNESE
  // =========================================================================
  QueixaPrincipal = '';
  HistoricoOdontologico = '';
  observacao = '';

  // =========================================================================
  // EXAME CLÍNICO — campos individuais (não mais concatenados em conduta)
  // =========================================================================
  HigieneBucal = '';
  CondicaoGengival = '';
  Oclusal = '';
  ATM = '';

  // =========================================================================
  // DIAGNÓSTICO E TRATAMENTO — campos individuais
  // =========================================================================
  Diagnostico = '';
  PlanoTratamento = '';
  ProcedimentosRealizados = '';
  Prescricao = '';
  Orientacoes = '';

  // =========================================================================
  // ODONTOGRAMA
  // =========================================================================
  odontograma: Dente[] = [];
  selectedDente: Dente | null = null;
  hoveredDente: number | null = null;

  readonly denteStatusOptions: DenteStatusOption[] = DENTE_STATUS_OPTIONS;

  private readonly destroy$ = new Subject<void>();

  private readonly TODOS_DENTES = [
    11, 12, 13, 14, 15, 16, 17, 18,
    21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48,
  ];

  constructor(
    private router: Router,
    private prontuarioDentistaApi: ProntuarioDentistaApiService,
    private prontuarioState: ProntuarioStateService,
    private errorHandler: ErrorHandlerService
  ) { }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================
  ngOnInit(): void {
    this.startTimer();
    this.inicializarOdontograma();
    this.prontuarioState.consulta$
      .pipe(takeUntil(this.destroy$))
      .subscribe(consulta => { this.Consulta = consulta; });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.prontuarioState.limpar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // ODONTOGRAMA — lógica
  // =========================================================================
  inicializarOdontograma(): void {
    this.odontograma = this.TODOS_DENTES.map(n => ({
      numero: n,
      status: 'sadio' as DenteStatus,
    }));
  }

  getDente(numero: number): Dente {
    return this.odontograma.find(d => d.numero === numero)
      ?? { numero, status: 'sadio' };
  }

  selecionarDente(dente: Dente): void {
    this.selectedDente = this.selectedDente?.numero === dente.numero ? null : dente;
  }

  selecionarPorNumero(numero: number): void {
    this.selecionarDente(this.getDente(numero));
  }

  atualizarStatusDente(status: DenteStatus): void {
    if (this.selectedDente) this.selectedDente.status = status;
  }

  // ─── Helpers de status ───────────────────────────────────────────────────
  getStatusOption(status: DenteStatus): DenteStatusOption { return getStatusOption(status); }
  getStatusColor(status: DenteStatus): string { return getStatusOption(status).color; }
  getStatusFill(status: DenteStatus): string { return getStatusOption(status).colorFill; }
  getLabelStatus(status: DenteStatus): string { return getStatusOption(status).label; }

  getToothFillColor(numero: number): string {
    return this.getStatusFill(this.getDente(numero).status);
  }

  getToothStrokeColor(numero: number): string {
    return this.getStatusColor(this.getDente(numero).status);
  }

  isSelected(numero: number): boolean { return this.selectedDente?.numero === numero; }
  isHovered(numero: number): boolean { return this.hoveredDente === numero; }

  get dentesAlterados(): number {
    return this.odontograma.filter(d => d.status !== 'sadio').length;
  }

  /**
   * Serializa o odontograma como lista estruturada para o backend.
   * Envia APENAS dentes alterados OU com observação — sadios sem nota são ignorados.
   */
  private serializarOdontograma(): DentePayload[] {
    return this.odontograma
      .filter(d => d.status !== 'sadio' || (d.observacao && d.observacao.trim().length > 0))
      .map(d => ({
        numeroFdi: d.numero,
        status: d.status,
        observacao: d.observacao?.trim() || undefined,
      }));
  }

  // =========================================================================
  // FINALIZAÇÃO
  // =========================================================================
  finalizar(): void {
    this.FinalizarConsulta = true;
    Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Deseja finalizar a consulta odontológica?',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
    }).then(result => {
      if (result.isConfirmed) {
        this.concluido();
      } else {
        this.FinalizarConsulta = false;
        Swal.fire({ icon: 'success', title: 'Retomando consulta', showConfirmButton: false, timer: 1500 });
      }
    });
  }

  private concluido(): void {
    const today = new Date().toISOString().split('T')[0];

    const payload: ProntuarioDentistaRequest = {
      // anamnese
      queixaPrincipal: this.QueixaPrincipal,
      anamnese: this.HistoricoOdontologico,
      observacao: this.observacao,

      // exame clínico — campos separados (não mais concatenados)
      higieneBucal: this.HigieneBucal,
      condicaoGengival: this.CondicaoGengival,
      oclusal: this.Oclusal,
      atm: this.ATM,

      // odontograma — lista estruturada de dentes alterados
      odontograma: this.serializarOdontograma(),

      // diagnóstico e tratamento — campos separados
      diagnostico: this.Diagnostico,
      planoTratamento: this.PlanoTratamento,

      // prescrição
      prescricao: this.Prescricao,
      tituloPrescricao: 'Prescrição Odontológica',
      dataPrescricao: today,

      // procedimentos
      procedimentos: this.ProcedimentosRealizados,
      orientacoes: this.Orientacoes,
      tituloExame: 'Procedimentos Odontológicos',
      dataExame: today,

      // controle
      dataFinalizado: today,
      tempoDuracao: `${this.minutes}:${String(this.seconds).padStart(2, '0')}`,

      // relacionamentos
      codigoMedico: this.Consulta.profissionalId,
      consulta: this.Consulta.id,
    };

    this.finalizarProntuario(payload);
  }

  private finalizarProntuario(payload: ProntuarioDentistaRequest): void {
    this.prontuarioDentistaApi
      .cadastrarProntuarioByOrg(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.errorHandler.showSuccessToast('Prontuário odontológico finalizado com sucesso');
          this.stopTimer();
          setTimeout(() => this.router.navigate(['/Agenda-Medico']), 1500);
        },
        error: (error) => {
          console.error('Erro ao cadastrar prontuário odontológico:', error);
          this.errorHandler.showError('Erro ao salvar prontuário');
          this.FinalizarConsulta = false;
        },
      });
  }

  // =========================================================================
  // TIMER
  // =========================================================================
  startTimer(): void {
    this.interval = setInterval(() => {
      this.timer++;
      this.minutes = Math.floor(this.timer / 60);
      this.seconds = this.timer % 60;
    }, 1000);
  }

  stopTimer(): void {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  pausarTempo(): void { this.stopTimer(); }
}
