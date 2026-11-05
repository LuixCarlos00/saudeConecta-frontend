import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';
import {
  DadosRascunho,
  RascunhoAtendimentoResponse,
  TipoRascunho,
} from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';

/** Estado do salvamento automático, exibido no cabeçalho do atendimento. */
export type EstadoAutosave = 'ocioso' | 'salvando' | 'salvo' | 'erro' | 'encerrado';

/** Como o autosave lê e reaplica o conteúdo do atendimento (cada tela injeta o seu). */
export interface ConfigAutosave {
  consultaId: number;
  tipo: TipoRascunho;
  /** Lê o estado atual das abas (getDados/getDadosRascunho de cada uma). */
  coletar: () => DadosRascunho;
  /** Cronômetro acumulado, em segundos. */
  tempoSegundos: () => number;
  /** Reaplica um rascunho nas abas e no cronômetro (usado pelo "Recarregar" do conflito 409). */
  aplicar: (rascunho: RascunhoAtendimentoResponse) => void;
}

/** Intervalo da verificação de alteração. */
export const INTERVALO_VERIFICACAO_MS = 2000;
/** Tempo sem alterações antes de gravar. */
export const DEBOUNCE_MS = 5000;

/**
 * Salvamento automático do rascunho do atendimento, compartilhado por médico e dentista.
 * Fornecido por componente (não é singleton): cada atendimento tem a sua instância.
 *
 * Detecção de alteração: a cada 2 s compara o JSON do que as abas devolvem com o último visto.
 * Mudou, (re)arma um debounce de 5 s; passados 5 s sem nova mudança, grava. Essa comparação
 * pega qualquer campo (ngModel, listas, odontograma) sem exigir um @Output em cada aba.
 * Também grava ao trocar de aba e ao sair da tela (salvarAgora).
 */
@Injectable()
export class RascunhoAutosaveService {

  estado: EstadoAutosave = 'ocioso';
  salvoEm: Date | null = null;
  /** Detalhe do último erro (mensagem do back), para tooltip. */
  detalheErro: string | null = null;

  private config: ConfigAutosave | null = null;
  private versao: number | null = null;
  private baseline = '';
  private ultimoVisto = '';
  private tempoSalvo = 0;
  private parado = true;
  private emConflito = false;
  private emVoo: Subscription | null = null;
  private pendente = false;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private debounce: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: RascunhoAtendimentoApiService) { }

  /** Existe rascunho gravado no servidor para esta consulta. */
  get temRascunho(): boolean {
    return this.versao !== null;
  }

  /** Texto do indicador do cabeçalho, ou null quando não há nada a mostrar. */
  get mensagem(): string | null {
    switch (this.estado) {
      case 'salvando': return 'Salvando…';
      case 'salvo': return this.salvoEm ? `Rascunho salvo às ${this.formatarHora(this.salvoEm)}` : null;
      case 'erro': return 'Não foi possível salvar o rascunho';
      case 'encerrado': return 'Consulta encerrada: o rascunho não é mais salvo';
      default: return null;
    }
  }

  /**
   * Começa a vigiar alterações. Deve ser chamado depois de as abas receberem o rascunho restaurado,
   * porque o estado dessa hora vira a referência ("sem alteração").
   * @param config leitura/aplicação do conteúdo
   * @param versaoInicial versão do rascunho carregado, ou null se não havia
   */
  iniciar(config: ConfigAutosave, versaoInicial: number | null): void {
    this.parar(true);
    this.config = config;
    this.versao = versaoInicial;
    this.parado = false;
    this.emConflito = false;
    this.estado = 'ocioso';
    this.detalheErro = null;
    this.rebase();
    this.intervalo = setInterval(() => this.verificar(), INTERVALO_VERIFICACAO_MS);
  }

  /**
   * Para o autosave (nenhuma gravação nova sai depois disso).
   * @param cancelarEmVoo true cancela um PUT ainda em andamento (ex.: antes de finalizar, para não
   *        recriar o rascunho depois que o back o apagou); false deixa terminar (ex.: ao sair da tela).
   */
  parar(cancelarEmVoo = false): void {
    this.parado = true;
    if (this.intervalo) { clearInterval(this.intervalo); this.intervalo = null; }
    this.limparDebounce();
    if (cancelarEmVoo && this.emVoo) {
      this.emVoo.unsubscribe();
      this.emVoo = null;
      this.pendente = false;
    }
  }

  /** Volta a vigiar depois de um parar() (ex.: finalizar falhou e o profissional continua atendendo). */
  retomar(): void {
    if (!this.config || !this.parado || this.estado === 'encerrado') { return; }
    this.parado = false;
    if (!this.intervalo) {
      this.intervalo = setInterval(() => this.verificar(), INTERVALO_VERIFICACAO_MS);
    }
  }

  /**
   * Zera a referência: o conteúdo atual passa a ser "sem alteração".
   * Usado após restaurar, recarregar ou descartar.
   * @param versao nova versão do servidor; undefined mantém a atual
   */
  rebase(versao?: number | null): void {
    if (versao !== undefined) { this.versao = versao; }
    this.limparDebounce();
    if (!this.config) { return; }
    this.baseline = this.serializar();
    this.ultimoVisto = this.baseline;
    this.tempoSalvo = this.config.tempoSegundos();
  }

  /**
   * Grava agora, sem esperar o debounce. Não faz nada se não houver alteração (nem rascunho
   * existente com cronômetro diferente): entrar e sair sem digitar não cria rascunho.
   */
  salvarAgora(): void {
    if (this.parado || this.emConflito || !this.config) { return; }
    this.limparDebounce();
    const instantaneo = this.serializar();
    const tempo = this.config.tempoSegundos();
    const mudouDados = instantaneo !== this.baseline;
    const mudouTempo = this.versao !== null && tempo !== this.tempoSalvo;
    if (!mudouDados && !mudouTempo) { return; }
    if (this.emVoo) { this.pendente = true; return; }

    const config = this.config;
    this.estado = 'salvando';
    const inscricao = this.api.salvar(config.consultaId, {
      tipo: config.tipo,
      dados: JSON.parse(instantaneo),
      tempoAcumuladoSegundos: tempo,
      versao: this.versao,
    }).subscribe({
      next: resposta => {
        this.emVoo = null;
        this.versao = resposta.versao;
        this.baseline = instantaneo;
        this.tempoSalvo = tempo;
        this.estado = 'salvo';
        this.salvoEm = new Date();
        this.detalheErro = null;
        this.executarPendente();
      },
      error: (erro: HttpErrorResponse) => {
        this.emVoo = null;
        this.tratarErro(erro);
      },
    });
    // Resposta síncrona (cache/teste) já fechou a inscrição: não deixa emVoo preso.
    this.emVoo = inscricao.closed ? null : inscricao;
  }

  /** Comparação periódica: mudou em relação ao último visto, rearma o debounce. */
  private verificar(): void {
    if (this.parado || this.emConflito || !this.config) { return; }
    const atual = this.serializar();
    if (atual === this.ultimoVisto) { return; }
    this.ultimoVisto = atual;
    if (atual === this.baseline) { this.limparDebounce(); return; }
    this.agendar();
  }

  private agendar(): void {
    this.limparDebounce();
    this.debounce = setTimeout(() => this.salvarAgora(), DEBOUNCE_MS);
  }

  private executarPendente(): void {
    if (this.pendente) {
      this.pendente = false;
      this.salvarAgora();
    }
  }

  private tratarErro(erro: HttpErrorResponse): void {
    const codigo = erro?.error?.code;
    if (erro?.status === 409 && codigo === 'RASCUNHO_DESATUALIZADO') {
      this.tratarDesatualizado();
      return;
    }
    if (erro?.status === 409 && codigo === 'CONSULTA_ENCERRADA') {
      this.parar();
      this.estado = 'encerrado';
      Swal.fire({
        icon: 'info',
        title: 'Consulta encerrada',
        text: extrairMensagemErro(erro) || 'Esta consulta já foi encerrada. O rascunho não será mais salvo.',
        confirmButtonColor: '#667eea',
      });
      return;
    }
    this.estado = 'erro';
    this.detalheErro = extrairMensagemErro(erro);
    // 413/422: o mesmo conteúdo seria recusado de novo; só tenta outra vez quando algo mudar.
    if (erro?.status !== 413 && erro?.status !== 422) { this.agendar(); }
  }

  /** 409 de versão: outra aba/computador salvou depois. A única saída é recarregar o que está no servidor. */
  private tratarDesatualizado(): void {
    this.emConflito = true;
    this.limparDebounce();
    this.estado = 'erro';
    Swal.fire({
      icon: 'warning',
      title: 'Atendimento alterado em outro lugar',
      text: 'Este atendimento foi alterado em outra aba ou computador. Recarregue para ver a versão mais recente.',
      confirmButtonText: 'Recarregar',
      confirmButtonColor: '#667eea',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(() => this.recarregar());
  }

  private recarregar(): void {
    const config = this.config;
    if (!config) { return; }
    this.api.buscar(config.consultaId).subscribe({
      next: rascunho => {
        this.emConflito = false;
        if (rascunho) {
          config.aplicar(rascunho);
          this.rebase(rascunho.versao);
          this.estado = 'salvo';
          this.salvoEm = new Date();
        } else {
          // O rascunho sumiu no servidor (descartado em outro lugar): mantém o que está na tela
          // e grava de novo como primeira versão.
          this.rebase(null);
          this.baseline = '';
          this.estado = 'ocioso';
          this.agendar();
        }
      },
      error: (erro: HttpErrorResponse) => {
        this.emConflito = false;
        this.detalheErro = extrairMensagemErro(erro);
        this.estado = 'erro';
      },
    });
  }

  private serializar(): string {
    return JSON.stringify(this.config?.coletar() ?? {});
  }

  private limparDebounce(): void {
    if (this.debounce) { clearTimeout(this.debounce); this.debounce = null; }
  }

  private formatarHora(data: Date): string {
    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
  }
}
