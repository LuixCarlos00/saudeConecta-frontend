import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener } from '@angular/core';
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
import { AbaQuestionarioSaudeComponent } from './aba-questionario-saude/aba-questionario-saude.component';
import { formatarDataLocal } from '../../../shared/utils/data-local';
import { extrairMensagemErro } from '../../../shared/utils/mensagem-erro-http';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { ConfigAutosave, RascunhoAutosaveService } from 'src/app/services/state/rascunho-autosave.service';
import { DadosRascunho, RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';

@Component({
  selector: 'app-prontuario-medico',
 
  providers: [RascunhoAutosaveService],
  templateUrl: './prontuario-medico.component.html',
  styleUrl: './prontuario-medico.component.scss'
})
export class ProntuarioMedicoComponent implements OnInit, OnDestroy, AfterViewInit {

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
  private _selectedTabIndex = 0;
  /** Trocar de aba grava o rascunho na hora (além do debounce). */
  get selectedTabIndex(): number { return this._selectedTabIndex; }
  set selectedTabIndex(valor: number) {
    if (valor !== this._selectedTabIndex) {
      this._selectedTabIndex = valor;
      this.autosave.salvarAgora();
    }
  }
  timer = 0;
  minutes = 0;
  seconds = 0;
  interval: ReturnType<typeof setInterval> | null = null;
  isPaused = false;
  Consulta: Consultav2 | null = null;
  FinalizarConsulta = false;

  // Restauração do rascunho: só roda quando a view existe E o GET respondeu.
  private rascunhoSolicitado = false;
  private rascunhoPronto = false;
  private viewPronta = false;
  private abasInicializadas = false;
  private rascunhoInicial: RascunhoAtendimentoResponse | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private prontuarioApi: ProntuarioApiService,
    private prontuarioState: ProntuarioStateService,
    private errorHandler: ErrorHandlerService,
    private rascunhoApi: RascunhoAtendimentoApiService,
    public autosave: RascunhoAutosaveService
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
        this.carregarRascunho(consulta);
      });
  }

  ngAfterViewInit(): void {
    this.viewPronta = true;
    this.tentarInicializarAbas();
  }

  /** Tentativa de última hora de gravar ao fechar/recarregar a aba do navegador (best effort). */
  @HostListener('window:beforeunload')
  aoFecharJanela(): void {
    this.autosave.salvarAgora();
  }

  ngOnDestroy(): void {
    // Último PUT antes de sair; se o atendimento foi finalizado o autosave já está parado e nada é gravado.
    this.autosave.salvarAgora();
    this.autosave.parar();
    this.stopTimer();
    this.prontuarioState.limpar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // RASCUNHO
  // =========================================================================
  private carregarRascunho(consulta: Consultav2 | null): void {
    if (!consulta?.id || this.rascunhoSolicitado) { return; }
    this.rascunhoSolicitado = true;
    this.rascunhoApi.buscar(consulta.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rascunho => {
          this.rascunhoInicial = rascunho;
          this.rascunhoPronto = true;
          this.tentarInicializarAbas();
        },
        error: (erro) => {
          this.errorHandler.showError(
            extrairMensagemErro(erro) || 'Não foi possível carregar o rascunho deste atendimento.'
          );
          this.rascunhoPronto = true;
          this.tentarInicializarAbas();
        },
      });
  }

  private tentarInicializarAbas(): void {
    if (!this.viewPronta || !this.rascunhoPronto || this.abasInicializadas) { return; }
    this.abasInicializadas = true;
    // setTimeout: deixa os filhos terminarem a primeira detecção de mudanças (como a tela já fazia).
    setTimeout(() => this.inicializarAbas(), 0);
  }

  private inicializarAbas(): void {
    const rascunho = this.rascunhoInicial;
    if (rascunho) {
      this.aplicarRascunho(rascunho);
      this.errorHandler.showSuccessToast('Atendimento retomado');
    } else {
      // Observações da consulta só entram quando não há rascunho: não sobrescrevem o que o profissional digitou.
      this.preencherObservacoesConsulta(this.Consulta);
    }
    if (!this.Consulta?.id) { return; }
    this.autosave.iniciar(this.configAutosave(this.Consulta.id), rascunho?.versao ?? null);
  }

  private configAutosave(consultaId: number): ConfigAutosave {
    return {
      consultaId,
      tipo: 'MEDICO',
      coletar: () => this.coletarDados(),
      tempoSegundos: () => this.timer,
      aplicar: r => this.aplicarRascunho(r),
    };
  }

  private preencherObservacoesConsulta(consulta: Consultav2 | null): void {
    if (consulta?.observacoes && this.abaExameObjetivo) {
      this.abaExameObjetivo.observacao = consulta.observacoes;
    }
  }

  /** Lê o conteúdo das abas no formato do rascunho: { identificacao, exame, planejamento, codigos }. */
  private coletarDados(): DadosRascunho {
    return {
      identificacao: this.abaIdentificacao?.getDados() ?? {},
      exame: this.abaExameObjetivo?.getDados() ?? {},
      planejamento: this.abaPlanejamento?.getDadosRascunho() ?? {},
      codigos: this.abaCodigosTussCid?.getDadosRascunho() ?? {},
    };
  }

  private aplicarRascunho(rascunho: RascunhoAtendimentoResponse): void {
    const dados = rascunho.dados;
    this.abaIdentificacao?.setDados(dados?.identificacao);
    this.abaExameObjetivo?.setDados(dados?.exame);
    this.abaPlanejamento?.setDados(dados?.planejamento);
    this.abaCodigosTussCid?.setDados(dados?.codigos);
    this.definirTempo(rascunho.tempoAcumuladoSegundos ?? 0);
  }

  /** Limpa as abas e volta o cronômetro a zero (usado ao descartar o rascunho). */
  private limparAbas(): void {
    this.abaIdentificacao?.setDados({});
    this.abaExameObjetivo?.setDados({});
    this.abaPlanejamento?.setDados({ planejamentos: [] });
    this.abaCodigosTussCid?.setDados({
      tussSelecionados: [], cidSelecionados: [], tussExameSelecionados: [], cidExameSelecionados: [],
    });
    this.definirTempo(0);
    this.preencherObservacoesConsulta(this.Consulta);
  }

  /**
   * Descarta o rascunho no servidor (com confirmação) e limpa as abas.
   */
  descartarRascunho(): void {
    if (!this.Consulta?.id) { return; }
    const consultaId = this.Consulta.id;
    Swal.fire({
      icon: 'warning',
      title: 'Descartar rascunho?',
      text: 'Tudo o que foi digitado neste atendimento será apagado. Essa ação não pode ser desfeita.',
      showCancelButton: true,
      confirmButtonText: 'Descartar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    }).then(result => {
      if (!result.isConfirmed) { return; }
      this.autosave.parar(true);
      this.rascunhoApi.descartar(consultaId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.limparAbas();
            this.autosave.iniciar(this.configAutosave(consultaId), null);
            this.errorHandler.showSuccessToast('Rascunho descartado');
          },
          error: (erro) => {
            this.autosave.retomar();
            this.errorHandler.showError(extrairMensagemErro(erro) || 'Não foi possível descartar o rascunho.');
          },
        });
    });
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
    // Para o autosave antes de enviar: o back apaga o rascunho ao finalizar e não pode ser recriado depois.
    this.autosave.parar(true);
    const today = formatarDataLocal(new Date());

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
      codigoMedico: this.Consulta?.profissionalId || null,
      consulta: this.Consulta?.id || null,
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
          setTimeout(() => this.router.navigate(['/agenda-calendario']), 1500);
        },
        error: (error) => {
          console.error('Erro ao cadastrar prontuário médico:', error);
          this.errorHandler.showError('Erro ao salvar prontuário');
          this.FinalizarConsulta = false;
          this.autosave.retomar();
        },
      });
  }

  // =========================================================================
  // TIMER
  // =========================================================================
  startTimer(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.timer++;
      this.minutes = Math.floor(this.timer / 60);
      this.seconds = this.timer % 60;
    }, 1000);
  }

  /** Coloca o cronômetro em `segundos` (restauração do rascunho) e atualiza o display. */
  private definirTempo(segundos: number): void {
    this.timer = Math.max(0, Math.floor(segundos));
    this.minutes = Math.floor(this.timer / 60);
    this.seconds = this.timer % 60;
  }

  stopTimer(): void {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  toggleTimer(): void {
    if (this.isPaused) {
      this.startTimer();
      this.isPaused = false;
    } else {
      this.stopTimer();
      this.isPaused = true;
    }
  }
}
