import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { Consultav2 } from '../../../util/variados/interfaces/consulta/consultav2';
import { ProntuarioDentistaRequest } from '../../../util/variados/interfaces/Prontuario/ProntuarioDentista';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';

import { AbaIdentificacaoComponent } from './aba-identificacao/aba-identificacao.component';
import { AbaExameObjetivoComponent } from './aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaPlanejamentoComponent } from './aba-planejamento/aba-planejamento.component';
import { AbaCodigosTussCidComponent } from './aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';
import { AbaQuestionarioSaudeComponent } from './aba-questionario-saude/aba-questionario-saude.component';
import { AbaHistoricoComponent } from './aba-historico/aba-historico.component';

@Component({
  selector: 'app-prontuario-dentista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AbaIdentificacaoComponent,
    AbaExameObjetivoComponent,
    AbaPlanejamentoComponent,
    AbaCodigosTussCidComponent,
    AbaQuestionarioSaudeComponent,
    AbaHistoricoComponent,
  ],
  templateUrl: './prontuario-dentista.component.html',
  styleUrl: './prontuario-dentista.component.scss',
})
export class ProntuarioDentistaComponent implements OnInit, OnDestroy {

  // =========================================================================
  // VIEW CHILDREN — referências aos sub-componentes para colher dados
  // =========================================================================
  @ViewChild(AbaIdentificacaoComponent) abaIdentificacao!: AbaIdentificacaoComponent;
  @ViewChild(AbaExameObjetivoComponent) abaExameObjetivo!: AbaExameObjetivoComponent;
  @ViewChild(AbaPlanejamentoComponent) abaPlanejamento!: AbaPlanejamentoComponent;
  @ViewChild(AbaCodigosTussCidComponent) abaCodigosTussCid!: AbaCodigosTussCidComponent;

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
    private prontuarioDentistaApi: ProntuarioDentistaApiService,
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

    const dadosIdentificacao = this.abaIdentificacao?.getDados() || {};
    const dadosExame = this.abaExameObjetivo?.getDados() || {};
    const dadosPlanejamento = this.abaPlanejamento?.getDados() || {};
    const dadosCodigos = this.abaCodigosTussCid?.getDados() || {};

    const payload: any = {
      // Aba 1 — Identificação
      ...dadosIdentificacao,

      // Aba 2 — Exame Objetivo (sinais vitais, anamnese, odontograma, diagnóstico)
      ...dadosExame,

      // Aba 3 — Planejamento Terapêutico
      ...dadosPlanejamento,

      // Aba 4 — Códigos TUSS e CID / Prescrição / Exames
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
