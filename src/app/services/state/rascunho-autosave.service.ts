import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, Subscription, firstValueFrom, race, timer } from 'rxjs';
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
/** Intervalo para gravar quando só o cronômetro mudou (médico conversando, sem digitar). */
export const INTERVALO_TEMPO_MS = 60000;
/** Espera máxima por um PUT em andamento antes de finalizar/descartar. */
export const TIMEOUT_AGUARDAR_MS = 10000;

/** Serializa com chaves ordenadas, para comparar JSON sem depender da ordem que o back devolve. */
function canonico(valor: any): string {
  return JSON.stringify(valor, (_chave, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((o: any, k) => { o[k] = v[k]; return o; }, {})
      : v);
}

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
  private emVooFim$ = new Subject<void>();
  private pendente = false;
  /** Saindo da tela: o último PUT (e o pendente) ainda pode sair mesmo com o autosave parado. */
  private saindo = false;
  /**
   * Conteúdo do PUT anterior ao atual desta aba. Se ele chegou ao back mas a resposta se perdeu
   * (ou foi cancelada), o PUT seguinte leva 409 por causa dele: é o que reconhecemos no conflito.
   */
  private enviadoAnterior: { dados: string; tempo: number } | null = null;
  private enviadoAtual: { dados: string; tempo: number } | null = null;
  private ultimaGravacaoEm = 0;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private debounce: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: RascunhoAtendimentoApiService) { }

  /** Existe rascunho gravado no servidor para esta consulta. */
  get temRascunho(): boolean {
    return this.versao !== null;
  }

  /**
   * Há digitação que ainda não chegou ao servidor (mudança nas abas, PUT em andamento ou pendente).
   * Só o cronômetro não conta: ele muda sempre e faria o aviso de saída aparecer toda vez.
   */
  get temAlteracaoNaoSalva(): boolean {
    if (!this.config || this.estado === 'encerrado') { return false; }
    return !!this.emVoo || this.pendente || this.serializar() !== this.baseline;
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
    this.parar();
    this.pendente = false;
    this.saindo = false;
    this.config = config;
    this.versao = versaoInicial;
    this.parado = false;
    this.emConflito = false;
    this.estado = 'ocioso';
    this.detalheErro = null;
    this.rebase();
    this.intervalo = setInterval(() => this.verificar(), INTERVALO_VERIFICACAO_MS);
  }

  /** Para o autosave: nenhuma gravação nova sai depois disso (um PUT em andamento termina sozinho). */
  parar(): void {
    this.parado = true;
    if (this.intervalo) { clearInterval(this.intervalo); this.intervalo = null; }
    this.limparDebounce();
  }

  /**
   * Para o autosave e espera o PUT em andamento terminar. Usado antes de finalizar/descartar:
   * cancelar no navegador não impede o back de gravar, e a versão local ficaria velha.
   * @param timeoutMs espera máxima; passado o prazo segue mesmo assim
   */
  async pararEAguardar(timeoutMs = TIMEOUT_AGUARDAR_MS): Promise<void> {
    this.parar();
    this.pendente = false;
    if (!this.emVoo) { return; }
    await firstValueFrom(race(this.emVooFim$, timer(timeoutMs)));
  }

  /**
   * Chamado ao destruir a tela: grava a última edição (inclusive se já há um PUT em andamento)
   * e para. Se o autosave já estava parado (finalizado ou encerrado) não grava nada: o back
   * apagou o rascunho e ele não pode ser recriado.
   */
  sairDaTela(): void {
    if (this.parado) { return; }
    this.salvarAgora();
    this.saindo = true;
    this.parar();
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
    this.ultimaGravacaoEm = Date.now();
  }

  /**
   * Grava agora, sem esperar o debounce. Não faz nada se não houver alteração (nem rascunho
   * existente com cronômetro diferente): entrar e sair sem digitar não cria rascunho.
   */
  salvarAgora(): void {
    if ((this.parado && !this.saindo) || this.emConflito || !this.config) { return; }
    this.limparDebounce();
    const instantaneo = this.serializar();
    const tempo = this.config.tempoSegundos();
    const mudouDados = instantaneo !== this.baseline;
    const mudouTempo = this.versao !== null && tempo !== this.tempoSalvo;
    if (!mudouDados && !mudouTempo) { return; }
    if (this.emVoo) { this.pendente = true; return; }

    const config = this.config;
    this.estado = 'salvando';
    this.enviadoAnterior = this.enviadoAtual;
    this.enviadoAtual = { dados: instantaneo, tempo };
    const inscricao = this.api.salvar(config.consultaId, {
      tipo: config.tipo,
      dados: JSON.parse(instantaneo),
      tempoAcumuladoSegundos: tempo,
      versao: this.versao,
    }).subscribe({
      next: resposta => {
        this.emVoo = null;
        this.emVooFim$.next();
        this.versao = resposta.versao;
        this.baseline = instantaneo;
        this.tempoSalvo = tempo;
        this.ultimaGravacaoEm = Date.now();
        this.estado = 'salvo';
        this.salvoEm = new Date();
        this.detalheErro = null;
        this.executarPendente();
      },
      error: (erro: HttpErrorResponse) => {
        this.emVoo = null;
        this.emVooFim$.next();
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
    if (atual !== this.ultimoVisto) {
      this.ultimoVisto = atual;
      if (atual === this.baseline) { this.limparDebounce(); } else { this.agendar(); }
      return;
    }
    // Só o cronômetro andou: grava a cada INTERVALO_TEMPO_MS para o tempo não ficar parado no servidor.
    const soTempo = atual === this.baseline && !this.debounce && !this.emVoo && this.versao !== null;
    if (soTempo && Date.now() - this.ultimaGravacaoEm >= INTERVALO_TEMPO_MS
        && this.config.tempoSegundos() !== this.tempoSalvo) {
      this.salvarAgora();
    }
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
      // Parado (finalizando/saindo): não há como reconciliar nem avisar; o fluxo de saída segue.
      if (!this.parado) { this.reconciliarConflito(); }
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
    this.detalheErro = extrairMensagemErro(erro)
      || (erro?.status === 413 ? 'O rascunho é grande demais para ser salvo.' : null);
    // 413/422: o mesmo conteúdo seria recusado de novo; só tenta outra vez quando algo mudar.
    if (erro?.status !== 413 && erro?.status !== 422 && !this.parado) { this.agendar(); }
  }

  /**
   * 409 de versão. Pode ser a própria aba: o PUT anterior chegou ao back, mas a resposta se perdeu.
   * Busca o servidor; se ele guarda exatamente o conteúdo do PUT anterior desta aba, adota a versão
   * dele em silêncio e grava o conteúdo atual. Só avisa quando outro lugar realmente alterou.
   */
  private reconciliarConflito(): void {
    const config = this.config;
    const enviado = this.enviadoAnterior;
    if (!config) { return; }
    this.emConflito = true;
    this.limparDebounce();
    this.api.buscar(config.consultaId).subscribe({
      next: servidor => {
        if (this.parado) { this.emConflito = false; return; }
        if (servidor && enviado
            && servidor.tempoAcumuladoSegundos === enviado.tempo
            && canonico(servidor.dados) === canonico(JSON.parse(enviado.dados))) {
          this.versao = servidor.versao;
          this.baseline = enviado.dados;
          this.tempoSalvo = enviado.tempo;
          this.emConflito = false;
          this.estado = 'salvo';
          this.salvoEm = new Date();
          this.detalheErro = null;
          this.salvarAgora();
        } else {
          this.tratarDesatualizado();
        }
      },
      // Sem resposta do servidor não dá para decidir: cai no aviso, que oferece recarregar.
      error: () => { this.tratarDesatualizado(); },
    });
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
