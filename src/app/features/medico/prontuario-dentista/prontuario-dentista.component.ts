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
import { ProcedimentoPadraoApiService } from 'src/app/services/api/procedimento-padrao-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';
import { environment } from 'src/environments/environment';

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
  // ABA 1 — IDENTIFICAÇÃO DO PACIENTE
  // =========================================================================
  responsavel = '';
  inicioTratamento = '';
  terminoTratamento = '';
  interrupcao = '';

  // =========================================================================
  // ABA 2 — EXAME OBJETIVO (Sinais Vitais + Exame Intrabucal + Odontograma)
  // =========================================================================
  // Anamnese
  QueixaPrincipal = '';
  HistoricoOdontologico = '';
  observacao = '';
  // Exame Clínico
  HigieneBucal = '';
  CondicaoGengival = '';
  Oclusal = '';
  ATM = '';
  // Sinais Vitais
  pressaoArterial = '';
  pulso = '';
  altura = '';
  temperatura = '';
  peso = '';
  // Exame Extrabucal
  edema = '';
  facies = '';
  linfonodos = '';
  // Exame Intrabucal
  labios = '';
  mucosas = '';
  soalhoBucal = '';
  palato = '';
  orofaringe = '';
  lingua = '';
  gengiva = '';
  habitosNocivos = '';
  portadorAparelho = '';
  oclusao = '';
  exameOutros = '';
  // Sub-aba do exame objetivo
  exameSubTab = 0;

  // =========================================================================
  // ABA 2 — DIAGNÓSTICO E TRATAMENTO (mantidos na mesma aba)
  // =========================================================================
  Diagnostico = '';
  PlanoTratamento = '';
  ProcedimentosRealizados = '';
  Prescricao = '';
  Orientacoes = '';

  // =========================================================================
  // ABA 3 — PLANEJAMENTO TERAPÊUTICO
  // =========================================================================
  procedimentosPadrao: any[] = [];
  planejamentos: any[] = [];
  novoPlanejamento = { procedimentoRealizado: '', valor: 0, dataProcedimento: '' };
  mostrarFormProcedimento = false;
  novoProcedimentoPadrao = { nomeProcedimento: '', valorPadrao: 0 };

  // =========================================================================
  // ABA 4 — QUESTIONÁRIO DE SAÚDE
  // =========================================================================
  questionarioRespondido = false;
  questionarioStatus = '';
  questionarioRespostas: any = null;
  questionarioAssinatura = '';
  questionarioDataAssinatura = '';

  // =========================================================================
  // ABA 5 — HISTÓRICO DO PACIENTE
  // =========================================================================
  historicoProntuarios: any[] = [];
  historicoCarregado = false;
  historicoLoading = false;

  // =========================================================================
  // DADOS DO PACIENTE (para aba Identificação)
  // =========================================================================
  dadosPaciente: any = null;
  pacienteLoading = false;

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
    private errorHandler: ErrorHandlerService,
    private procedimentoPadraoApi: ProcedimentoPadraoApiService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService,
    private pacienteApi: PacienteApiService
  ) { }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================
  ngOnInit(): void {
    this.startTimer();
    this.inicializarOdontograma();
    this.prontuarioState.consulta$
      .pipe(takeUntil(this.destroy$))
      .subscribe(consulta => {
        this.Consulta = consulta;
        if (consulta?.id) {
          this.carregarQuestionarioSaude(consulta.id);
        }
        if (consulta?.profissionalId) {
          this.carregarProcedimentosPadrao(consulta.profissionalId);
        }
        if (consulta?.pacienteId) {
          this.carregarDadosPaciente(consulta.pacienteId);
          this.carregarHistoricoPaciente(consulta.pacienteId);
        }
      });
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
  // PLANEJAMENTO TERAPÊUTICO
  // =========================================================================
  carregarProcedimentosPadrao(profissionalId: number): void {
    this.procedimentoPadraoApi.listarPorProfissional(profissionalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => this.procedimentosPadrao = lista,
        error: () => this.procedimentosPadrao = []
      });
  }

  selecionarProcedimentoPadrao(event: any): void {
    const id = Number(event.target.value);
    const proc = this.procedimentosPadrao.find(p => p.id === id);
    if (proc) {
      this.novoPlanejamento.procedimentoRealizado = proc.nomeProcedimento;
      this.novoPlanejamento.valor = proc.valorPadrao || 0;
    }
  }

  adicionarPlanejamento(): void {
    if (!this.novoPlanejamento.procedimentoRealizado.trim()) {
      this.errorHandler.showError('Informe o procedimento realizado');
      return;
    }
    const payload = {
      prontuarioDentistaId: null as any,
      consultaId: this.Consulta.id,
      pacienteId: (this.Consulta as any).pacienteId,
      dataProcedimento: this.novoPlanejamento.dataProcedimento || new Date().toISOString().split('T')[0],
      procedimentoRealizado: this.novoPlanejamento.procedimentoRealizado,
      valor: this.novoPlanejamento.valor
    };
    this.planejamentos.push({
      ...payload,
      statusAssinatura: 'PENDENTE',
      _local: true
    });
    this.novoPlanejamento = { procedimentoRealizado: '', valor: 0, dataProcedimento: '' };
  }

  removerPlanejamento(index: number): void {
    const item = this.planejamentos[index];
    if (item.id && !item._local) {
      this.planejamentoApi.remover(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.planejamentos.splice(index, 1);
            this.errorHandler.showSuccessToast('Item removido');
          },
          error: () => this.errorHandler.showError('Erro ao remover item')
        });
    } else {
      this.planejamentos.splice(index, 1);
    }
  }

  criarProcedimentoPadrao(): void {
    if (!this.novoProcedimentoPadrao.nomeProcedimento.trim()) return;
    this.procedimentoPadraoApi.criar(this.Consulta.profissionalId, this.novoProcedimentoPadrao)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (criado) => {
          this.procedimentosPadrao.push(criado);
          this.novoProcedimentoPadrao = { nomeProcedimento: '', valorPadrao: 0 };
          this.mostrarFormProcedimento = false;
          this.errorHandler.showSuccessToast('Procedimento cadastrado');
        },
        error: () => this.errorHandler.showError('Erro ao cadastrar procedimento')
      });
  }

  get totalPlanejamento(): number {
    return this.planejamentos.reduce((sum, item) => sum + (item.valor || 0), 0);
  }


  // =========================================================================
  // DADOS DO PACIENTE
  // =========================================================================
  carregarDadosPaciente(pacienteId: number): void {
    this.pacienteLoading = true;
    this.pacienteApi.buscarrPacientebyOrg(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paciente) => {
          this.dadosPaciente = paciente;
          this.pacienteLoading = false;
          // dados do paciente carregados para exibição na aba Identificação
        },
        error: () => { this.pacienteLoading = false; }
      });
  }

  // =========================================================================
  // HISTÓRICO DO PACIENTE
  // =========================================================================
  carregarHistoricoPaciente(pacienteId: number): void {
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

  formatarOdontograma(dentes: any[]): string {
    if (!dentes || dentes.length === 0) return '';
    return dentes.map(d => {
      let texto = `Dente ${d.numeroFdi}: ${d.status}`;
      if (d.observacao) texto += ` — ${d.observacao}`;
      return texto;
    }).join('; ');
  }

  // =========================================================================
  // QUESTIONÁRIO DE SAÚDE
  // =========================================================================
  carregarQuestionarioSaude(consultaId: number): void {
    this.prontuarioDentistaApi.buscarQuestionarioSaude(consultaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.questionarioRespondido = resp?.respondido || false;
          this.questionarioStatus = resp?.status || '';
          if (resp?.respostasQuestionario) {
            try {
              this.questionarioRespostas = JSON.parse(resp.respostasQuestionario);
            } catch {
              this.questionarioRespostas = resp.respostasQuestionario;
            }
          }
          this.questionarioAssinatura = resp?.assinaturaBase64 || '';
          this.questionarioDataAssinatura = resp?.dataAssinatura || '';
        },
        error: () => { }
      });
  }



  get questionarioPerguntas(): { pergunta: string; resposta: string }[] {
    if (!this.questionarioRespostas) return [];
    if (Array.isArray(this.questionarioRespostas)) return this.questionarioRespostas;
    return Object.entries(this.questionarioRespostas).map(([key, value]) => ({
      pergunta: key,
      resposta: value as string
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

    const payload: any = {
      // anamnese
      queixaPrincipal: this.QueixaPrincipal,
      anamnese: this.HistoricoOdontologico,
      observacao: this.observacao,

      // exame clínico — campos separados
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

      // identificação do paciente
      responsavel: this.responsavel,
      inicioTratamento: this.inicioTratamento || null,
      terminoTratamento: this.terminoTratamento || null,
      interrupcao: this.interrupcao,

      // exame objetivo — sinais vitais
      pressaoArterial: this.pressaoArterial,
      pulso: this.pulso,
      altura: this.altura,
      temperatura: this.temperatura,
      peso: this.peso,
      edema: this.edema,
      facies: this.facies,
      linfonodos: this.linfonodos,
      labios: this.labios,
      mucosas: this.mucosas,
      soalhoBucal: this.soalhoBucal,
      palato: this.palato,
      orofaringe: this.orofaringe,

      // exame intrabucal
      lingua: this.lingua,
      gengiva: this.gengiva,
      habitosNocivos: this.habitosNocivos,
      portadorAparelho: this.portadorAparelho,
      oclusao: this.oclusao,
      exameOutros: this.exameOutros,

      // relacionamentos
      codigoMedico: this.Consulta.profissionalId,
      consulta: this.Consulta.id,

      // planejamento terapêutico — itens locais adicionados na aba 3
      planejamentos: this.planejamentos
        .filter(p => p._local)
        .map(p => ({
          dataProcedimento: p.dataProcedimento || today,
          procedimentoRealizado: p.procedimentoRealizado,
          valor: p.valor,
          pacienteId: (this.Consulta as any).pacienteId,
        })),
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
