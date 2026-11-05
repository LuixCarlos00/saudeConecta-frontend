import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener } from '@angular/core';
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
import { formatarDataLocal } from '../../../shared/utils/data-local';
import { extrairMensagemErro } from '../../../shared/utils/mensagem-erro-http';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { ConfigAutosave, RascunhoAutosaveService } from 'src/app/services/state/rascunho-autosave.service';
import { DadosRascunho, RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';

@Component({
  selector: 'app-prontuario-dentista',
 
  providers: [RascunhoAutosaveService],
  templateUrl: './prontuario-dentista.component.html',
  styleUrl: './prontuario-dentista.component.scss',
})
export class ProntuarioDentistaComponent implements OnInit, OnDestroy, AfterViewInit {

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
  Consulta: Consultav2 = {} as Consultav2;
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
    private prontuarioDentistaApi: ProntuarioDentistaApiService,
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

  /**
   * F5/fechar a aba: tenta gravar (best effort) e, havendo alteração não salva, pede o aviso nativo
   * do navegador. O texto é do navegador; returnValue só precisa existir.
   */
  @HostListener('window:beforeunload', ['$event'])
  aoFecharJanela(evento: BeforeUnloadEvent): void {
    this.autosave.salvarAgora();
    if (this.autosave.temAlteracaoNaoSalva) {
      evento.preventDefault();
      evento.returnValue = '';
    }
  }

  ngOnDestroy(): void {
    // Último PUT antes de sair (sai mesmo com outro PUT em andamento); se o atendimento foi finalizado
    // o autosave já está parado e nada é gravado.
    this.autosave.sairDaTela();
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
    // O guard já baixou o rascunho (F5/link direto): usa esse, sem repetir o GET.
    const preCarregado = this.prontuarioState.consumirRascunhoPreCarregado(consulta.id);
    if (preCarregado) {
      this.rascunhoInicial = preCarregado.rascunho;
      this.rascunhoPronto = true;
      this.tentarInicializarAbas();
      return;
    }
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
      tipo: 'DENTISTA',
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
      codigos: this.abaCodigosTussCid?.getDados() ?? {},
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
    this.abaExameObjetivo?.setDados({ odontograma: [] });
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
      // Espera um PUT em andamento terminar: se ele chegasse ao back depois do DELETE, recriaria o rascunho.
      this.autosave.pararEAguardar().then(() => {
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
    // Para o autosave e espera o PUT em andamento antes de enviar: o back apaga o rascunho ao finalizar
    // e ele não pode ser recriado (nem a versão local ficar velha se a finalização falhar).
    this.autosave.pararEAguardar().then(() => this.enviarFinalizacao());
  }

  private enviarFinalizacao(): void {
    const today = formatarDataLocal(new Date());

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
          setTimeout(() => this.router.navigate(['/agenda-calendario']), 1500);
        },
        error: (error) => {
          // 409 PRONTUARIO_JA_FINALIZADO: outro "Finalizar" (duplo clique, outra aba) já fechou a consulta.
          // Não religa o autosave (a consulta está encerrada) e volta para a agenda.
          if (error?.status === 409 && error?.error?.code === 'PRONTUARIO_JA_FINALIZADO') {
            this.stopTimer();
            this.errorHandler.showError(extrairMensagemErro(error) || 'Esta consulta já foi finalizada.');
            setTimeout(() => this.router.navigate(['/agenda-calendario']), 1500);
            return;
          }
          console.error('Erro ao cadastrar prontuário odontológico:', error);
          this.errorHandler.showError(extrairMensagemErro(error) || 'Erro ao salvar prontuário');
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
