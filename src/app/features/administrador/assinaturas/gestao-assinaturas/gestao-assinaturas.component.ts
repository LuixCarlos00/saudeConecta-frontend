import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subscription } from 'rxjs';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import {
  AssinaturaAdminApiService,
  AssinaturaResumoAdmin,
  CampoOrdenacaoAssinatura,
  PaginaAssinaturas,
  StatusAssinaturaFiltro,
  TipoPlanoFiltro
} from 'src/app/services/api/assinatura-admin-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { formatarDataBr } from 'src/app/shared/utils/data-local';
import { mensagemErroAssinaturaAdmin } from 'src/app/shared/utils/mensagem-erro-http';
import { ModalAssociarPlanoComponent } from '../../gerenciamento-usuarios/tabela-todos-usuarios/modal-associar-plano/modal-associar-plano.component';

/** Valor do filtro de cortesia na tela: vazio = todas. */
export type FiltroCortesia = '' | 'true' | 'false';

/** Texto e botão do alerta de confirmação das ações por linha. */
interface PerguntaConfirmacao {
  icon: 'question' | 'warning';
  title: string;
  html: string;
  confirmButtonText: string;
  confirmButtonColor?: string;
}

/**
 * Gestão de assinaturas do SUPER_ADMIN: lista paginada da assinatura vigente de cada clínica,
 * com filtros, ordenação e as ações de cortesia, suspender, cancelar e associar/trocar plano.
 */
@Component({
  selector: 'app-gestao-assinaturas',
  templateUrl: './gestao-assinaturas.component.html',
  styleUrls: ['./gestao-assinaturas.component.css']
})
export class GestaoAssinaturasComponent implements OnInit, OnDestroy {

  readonly statusOpcoes: StatusAssinaturaFiltro[] = ['TRIAL', 'ATIVA', 'INADIMPLENTE', 'SUSPENSA', 'CANCELADA'];
  readonly planoOpcoes: { valor: TipoPlanoFiltro; rotulo: string }[] = [
    { valor: 'STARTER', rotulo: 'Starter' },
    { valor: 'PROFISSIONAL', rotulo: 'Profissional' },
    { valor: 'BUSINESS', rotulo: 'Business' }
  ];
  readonly tamanhosPagina = [10, 20, 50, 100];
  readonly formatarData = (data: string | null) => formatarDataBr(data, '—');

  filtroStatus: StatusAssinaturaFiltro | '' = '';
  filtroPlano: TipoPlanoFiltro | '' = '';
  filtroCortesia: FiltroCortesia = '';
  filtroBusca = '';

  campoOrdenacao: CampoOrdenacaoAssinatura = 'organizacaoNome';
  direcaoOrdenacao: 'asc' | 'desc' = 'asc';

  pagina = 0;
  tamanho = 20;
  itens: AssinaturaResumoAdmin[] = [];
  total = 0;

  carregando = false;
  erro: string | null = null;
  /** assinaturaId com ação em andamento: trava só os botões daquela linha. */
  acaoEmAndamento: number | null = null;

  private requisicao?: Subscription;

  constructor(
    private adminApi: AssinaturaAdminApiService,
    private assinaturaApi: AssinaturaApiService,
    private notificacao: NotificacaoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.requisicao?.unsubscribe();
  }

  /** Busca a página atual com os filtros e a ordenação da tela; a resposta de uma chamada antiga é descartada. */
  carregar(): void {
    this.requisicao?.unsubscribe();
    this.carregando = true;
    this.erro = null;
    this.requisicao = this.adminApi.listar({
      status: this.filtroStatus,
      plano: this.filtroPlano,
      cortesia: this.filtroCortesia === '' ? null : this.filtroCortesia === 'true',
      busca: this.filtroBusca,
      page: this.pagina,
      size: this.tamanho,
      sort: `${this.campoOrdenacao},${this.direcaoOrdenacao}`
    }).subscribe({
      next: (resposta: PaginaAssinaturas<AssinaturaResumoAdmin>) => {
        this.itens = resposta.content;
        this.total = resposta.totalElements;
        this.carregando = false;
      },
      error: err => {
        this.itens = [];
        this.total = 0;
        this.erro = mensagemErroAssinaturaAdmin(err, 'Não foi possível carregar as assinaturas.');
        this.carregando = false;
      }
    });
  }

  /** Aplica os filtros voltando para a primeira página. */
  aplicarFiltros(): void {
    this.pagina = 0;
    this.carregar();
  }

  /** Zera os filtros (a ordenação é mantida). */
  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroPlano = '';
    this.filtroCortesia = '';
    this.filtroBusca = '';
    this.aplicarFiltros();
  }

  /** Há algum filtro ligado (habilita o "Limpar"). */
  get temFiltro(): boolean {
    return !!(this.filtroStatus || this.filtroPlano || this.filtroCortesia || this.filtroBusca.trim());
  }

  /**
   * Ordena pela coluna; clicar de novo na mesma inverte o sentido.
   *
   * @param campo coluna aceita pelo back
   */
  ordenarPor(campo: CampoOrdenacaoAssinatura): void {
    if (this.campoOrdenacao === campo) {
      this.direcaoOrdenacao = this.direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
    } else {
      this.campoOrdenacao = campo;
      this.direcaoOrdenacao = 'asc';
    }
    this.pagina = 0;
    this.carregar();
  }

  /** Valor de `aria-sort` do cabeçalho da coluna. */
  ariaSort(campo: CampoOrdenacaoAssinatura): 'ascending' | 'descending' | 'none' {
    if (this.campoOrdenacao !== campo) { return 'none'; }
    return this.direcaoOrdenacao === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Troca de página ou de tamanho pelo paginador.
   *
   * @param evento evento do MatPaginator
   */
  mudarPagina(evento: PageEvent): void {
    this.pagina = evento.pageIndex;
    this.tamanho = evento.pageSize;
    this.carregar();
  }

  /** Assinatura encerrada: as ações de cortesia, suspender e cancelar não fazem sentido. */
  encerrada(item: AssinaturaResumoAdmin): boolean {
    return item.status === 'CANCELADA';
  }

  /**
   * Liga ou desliga a cortesia depois de confirmar.
   *
   * @param item linha da listagem
   */
  alternarCortesia(item: AssinaturaResumoAdmin): void {
    const ligar = !item.cortesia;
    this.confirmar({
      icon: 'question',
      title: ligar ? 'Dar cortesia?' : 'Remover a cortesia?',
      html: ligar
        ? `<strong>${this.escapar(item.organizacaoNome)}</strong> ficará ATIVA sem cobrança. O cartão cadastrado, se houver, será cancelado no Mercado Pago.`
        : `<strong>${this.escapar(item.organizacaoNome)}</strong> volta para TRIAL por 7 dias e um link de pagamento será gerado.`,
      confirmButtonText: ligar ? 'Dar cortesia' : 'Remover cortesia'
    }, () => this.assinaturaApi.definirCortesia(item.assinaturaId, ligar),
      ligar ? 'Cortesia concedida' : 'Cortesia removida', 'Não foi possível alterar a cortesia.', item);
  }

  /**
   * Suspende a assinatura depois de confirmar.
   *
   * @param item linha da listagem
   */
  suspender(item: AssinaturaResumoAdmin): void {
    this.confirmar({
      icon: 'warning',
      title: 'Suspender assinatura?',
      html: `A cobrança de <strong>${this.escapar(item.organizacaoNome)}</strong> será pausada no Mercado Pago e a clínica perde o acesso, exceto à tela de pagamento.`,
      confirmButtonText: 'Suspender'
    }, () => this.assinaturaApi.suspender(item.assinaturaId),
      'Assinatura suspensa', 'Não foi possível suspender a assinatura.', item);
  }

  /**
   * Cancela a assinatura depois de confirmar (não tem volta).
   *
   * @param item linha da listagem
   */
  cancelar(item: AssinaturaResumoAdmin): void {
    this.confirmar({
      icon: 'warning',
      title: 'Cancelar assinatura?',
      html: `A cobrança de <strong>${this.escapar(item.organizacaoNome)}</strong> será encerrada no Mercado Pago. Esta ação não pode ser desfeita.`,
      confirmButtonText: 'Cancelar assinatura',
      confirmButtonColor: '#d33'
    }, () => this.assinaturaApi.cancelar(item.assinaturaId),
      'Assinatura cancelada', 'Não foi possível cancelar a assinatura.', item);
  }

  /**
   * Abre o modal de associar/trocar plano já com a organização da linha.
   *
   * @param item linha da listagem
   */
  associarPlano(item: AssinaturaResumoAdmin): void {
    this.dialog.open(ModalAssociarPlanoComponent, {
      width: '700px',
      data: { organizacaoId: item.organizacaoId, nomeOrganizacao: item.organizacaoNome },
      disableClose: true
    }).afterClosed().subscribe((alterou: boolean) => {
      if (alterou) { this.carregar(); }
    });
  }

  trackPorAssinatura(_indice: number, item: AssinaturaResumoAdmin): number {
    return item.assinaturaId;
  }

  /** Pede confirmação; confirmada, roda a ação, avisa o resultado e recarrega a lista. */
  private confirmar(
    pergunta: PerguntaConfirmacao,
    acao: () => Observable<unknown>,
    sucesso: string,
    padraoErro: string,
    item: AssinaturaResumoAdmin
  ): void {
    this.notificacao.fire({ showCancelButton: true, cancelButtonText: 'Voltar', ...pergunta }).then(r => {
      if (!r.isConfirmed || this.acaoEmAndamento !== null) { return; }
      this.acaoEmAndamento = item.assinaturaId;
      acao().subscribe({
        next: () => {
          this.acaoEmAndamento = null;
          this.notificacao.mostrarToast('success', sucesso);
          this.carregar();
        },
        error: err => {
          this.acaoEmAndamento = null;
          this.notificacao.showError(mensagemErroAssinaturaAdmin(err, padraoErro));
          // 404/409 indicam que a linha mudou por fora: recarrega para mostrar o estado real
          this.carregar();
        }
      });
    });
  }

  /** O nome da clínica entra em HTML do alerta: escapa para não injetar marcação. */
  private escapar(texto: string): string {
    return texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  }
}
