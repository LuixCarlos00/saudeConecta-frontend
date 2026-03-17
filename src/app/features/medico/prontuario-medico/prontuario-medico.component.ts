import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { Consultav2 } from '../../../util/variados/interfaces/consulta/consultav2';

import { AbaIdentificacaoMedicoComponent } from './aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaExameObjetivoMedicoComponent } from './aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaCodigosTussCidMedicoComponent } from './aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';
import { AbaHistoricoMedicoComponent } from './aba-historico-medico/aba-historico-medico.component';
import { AbaPlanejamentoMedicoComponent } from './aba-planejamento-medico/aba-planejamento-medico.component';

@Component({
  selector: 'app-prontuario-medico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AbaIdentificacaoMedicoComponent,
    AbaExameObjetivoMedicoComponent,
    AbaCodigosTussCidMedicoComponent,
    AbaPlanejamentoMedicoComponent,
    AbaHistoricoMedicoComponent,
  ],
  templateUrl: './prontuario-medico.component.html',
  styleUrl: './prontuario-medico.component.scss'
})
export class ProntuarioMedicoComponent implements OnInit, OnDestroy {

  // =========================================================================
  // VIEW CHILDREN — referências aos sub-componentes para colher dados
  // =========================================================================
  @ViewChild(AbaIdentificacaoMedicoComponent) abaIdentificacao!: AbaIdentificacaoMedicoComponent;
  @ViewChild(AbaExameObjetivoMedicoComponent) abaExameObjetivo!: AbaExameObjetivoMedicoComponent;
  @ViewChild(AbaCodigosTussCidMedicoComponent) abaCodigosTussCid!: AbaCodigosTussCidMedicoComponent;
  @ViewChild(AbaPlanejamentoMedicoComponent) abaPlanejamento!: AbaPlanejamentoMedicoComponent;

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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private prontuarioApi: ProntuarioApiService,
    private prontuarioState: ProntuarioStateService,
    private errorHandler: ErrorHandlerService
  ) { }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================
  ngOnInit(): void {
    this.startTimer();
    this.prontuarioState.consulta$
      .pipe(takeUntil(this.destroy$))
      .subscribe(consulta => {
        this.Consulta = consulta;
      });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.prontuarioState.limpar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // FINALIZAÇÃO
  // =========================================================================
  finalizar(): void {
    this.FinalizarConsulta = true;
    Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Deseja finalizar a consulta médica?',
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

    const dadosIdentificacao = this.abaIdentificacao?.getDados() || {};
    const dadosExame = this.abaExameObjetivo?.getDados() || {};
    const dadosCodigos = this.abaCodigosTussCid?.getDados() || {};
    const dadosPlanejamento = this.abaPlanejamento?.getDados() || {};

    const payload: any = {
      // Aba 0 — Identificação
      ...dadosIdentificacao,

      // Aba 1 — Exame Objetivo (sinais vitais, anamnese, diagnóstico)
      ...dadosExame,

      // Aba 2 — Planejamento Terapêutico
      ...dadosPlanejamento,

      // Aba 3 — Códigos TUSS e CID / Prescrição / Exames
      ...dadosCodigos,
      dataPrescricao: today,

      // Controle
      dataFinalizado: today,
      tempoDuracao: `${this.minutes}:${String(this.seconds).padStart(2, '0')}`,

      // Relacionamentos
      codigoMedico: this.Consulta.profissionalId,
      consulta: this.Consulta.id,
    };

    this.finalizarProntuario(payload);
  }

  private finalizarProntuario(payload: any): void {
    this.prontuarioApi.cadastrarProntuarioMedico(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.errorHandler.showSuccessToast('Prontuário médico finalizado com sucesso');
          this.stopTimer();
          setTimeout(() => this.router.navigate(['/Agenda-Medico']), 1500);
        },
        error: (error) => {
          console.error('Erro ao cadastrar prontuário médico:', error);
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
