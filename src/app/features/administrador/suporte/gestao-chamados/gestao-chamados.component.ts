import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';

import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { ChamadoSuporteApiService } from 'src/app/services/api/chamado-suporte-api.service';
import {
  ChamadoSuporteResponse,
  PrioridadeChamado,
  StatusChamado
} from 'src/app/util/variados/interfaces/suporte/ChamadoSuporte';

/**
 * Tela exclusiva do perfil ROOT para acompanhamento e triagem dos chamados
 * de suporte abertos por todas as organizacoes.
 */
@Component({
  selector: 'app-gestao-chamados',
  templateUrl: './gestao-chamados.component.html',
  styleUrls: ['./gestao-chamados.component.css']
})
export class GestaoChamadosComponent implements OnInit, OnDestroy {

  /** Opcoes de status disponiveis para triagem */
  readonly statusDisponiveis: Array<{ valor: StatusChamado; label: string }> = [
    { valor: 'EM_ANALISE', label: 'Em análise' },
    { valor: 'EM_ANDAMENTO', label: 'Em andamento' },
    { valor: 'CONCLUIDO', label: 'Concluído' },
    { valor: 'CANCELADO', label: 'Cancelado' }
  ];

  /** Opcoes de prioridade para o filtro */
  readonly prioridadesDisponiveis: Array<{ valor: PrioridadeChamado; label: string }> = [
    { valor: 'BAIXA', label: 'Baixa' },
    { valor: 'MEDIA', label: 'Média' },
    { valor: 'ALTA', label: 'Alta' }
  ];

  chamados: ChamadoSuporteResponse[] = [];
  chamadoSelecionado: ChamadoSuporteResponse | null = null;

  filtroStatus: StatusChamado | '' = '';
  filtroPrioridade: PrioridadeChamado | '' = '';

  paginaAtual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  readonly tamanhoPagina = 10;

  isCarregando = false;
  isAtualizandoStatus = false;
  mostrarModalStatus = false;

  novoStatus: StatusChamado | '' = '';
  observacaoStatus = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private chamadoSuporteApiService: ChamadoSuporteApiService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.carregarChamados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega a pagina atual de chamados aplicando os filtros selecionados.
   */
  carregarChamados(): void {
    this.isCarregando = true;

    this.chamadoSuporteApiService
      .listarTodos(
        this.filtroStatus || undefined,
        this.filtroPrioridade || undefined,
        this.paginaAtual,
        this.tamanhoPagina
      )
      .pipe(takeUntil(this.destroy$), finalize(() => this.isCarregando = false))
      .subscribe({
        next: (pagina) => {
          this.chamados = pagina.content ?? [];
          this.totalPaginas = pagina.totalPages ?? 0;
          this.totalRegistros = pagina.totalElements ?? 0;
        },
        error: (erro) => this.errorHandler.handleHttpError(erro, 'carregamento dos chamados')
      });
  }

  /**
   * Reaplica os filtros voltando para a primeira pagina.
   */
  aplicarFiltros(): void {
    this.paginaAtual = 0;
    this.carregarChamados();
  }

  /**
   * Limpa os filtros ativos e recarrega a listagem.
   */
  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroPrioridade = '';
    this.aplicarFiltros();
  }

  /**
   * Navega entre as paginas da listagem.
   *
   * @param pagina indice da pagina desejada
   */
  irParaPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas) {
      return;
    }
    this.paginaAtual = pagina;
    this.carregarChamados();
  }

  /**
   * Abre o painel de detalhes carregando o chamado completo com anexos.
   *
   * @param chamado chamado selecionado na listagem
   */
  selecionarChamado(chamado: ChamadoSuporteResponse): void {
    this.chamadoSelecionado = chamado;

    this.chamadoSuporteApiService.buscarPorId(chamado.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalhe) => this.chamadoSelecionado = detalhe,
        error: (erro) => this.errorHandler.handleHttpError(erro, 'carregamento do chamado')
      });
  }

  fecharDetalhe(): void {
    this.chamadoSelecionado = null;
  }

  /**
   * Abre o modal de alteracao de status para o chamado selecionado.
   *
   * @param chamado chamado alvo da alteracao
   */
  abrirModalStatus(chamado: ChamadoSuporteResponse): void {
    this.chamadoSelecionado = chamado;
    this.novoStatus = chamado.status;
    this.observacaoStatus = '';
    this.mostrarModalStatus = true;
  }

  fecharModalStatus(): void {
    this.mostrarModalStatus = false;
    this.novoStatus = '';
    this.observacaoStatus = '';
  }

  /**
   * Persiste o novo status do chamado. O autor recebe email automaticamente.
   */
  confirmarAtualizacaoStatus(): void {
    if (!this.chamadoSelecionado || !this.novoStatus) {
      return;
    }

    this.isAtualizandoStatus = true;

    this.chamadoSuporteApiService
      .atualizarStatus(this.chamadoSelecionado.id, {
        status: this.novoStatus,
        observacao: this.observacaoStatus?.trim() || null
      })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isAtualizandoStatus = false))
      .subscribe({
        next: (atualizado) => {
          this.chamados = this.chamados.map(item => item.id === atualizado.id ? atualizado : item);
          this.chamadoSelecionado = atualizado;
          this.fecharModalStatus();
          this.errorHandler.showSuccessToast('Status atualizado. O autor foi notificado por email.');
        },
        error: (erro) => this.errorHandler.handleHttpError(erro, 'atualizacao do status')
      });
  }

  /**
   * Retorna a classe CSS correspondente ao status informado.
   *
   * @param status status do chamado
   * @returns nome da classe de estilo
   */
  obterClasseStatus(status: StatusChamado): string {
    const mapa: Record<StatusChamado, string> = {
      EM_ANALISE: 'status-analise',
      EM_ANDAMENTO: 'status-andamento',
      CONCLUIDO: 'status-concluido',
      CANCELADO: 'status-cancelado'
    };
    return mapa[status];
  }

  /**
   * Retorna a classe CSS correspondente a prioridade informada.
   *
   * @param prioridade prioridade do chamado
   * @returns nome da classe de estilo
   */
  obterClassePrioridade(prioridade: PrioridadeChamado): string {
    const mapa: Record<PrioridadeChamado, string> = {
      ALTA: 'prioridade-alta',
      MEDIA: 'prioridade-media',
      BAIXA: 'prioridade-baixa'
    };
    return mapa[prioridade];
  }
}
