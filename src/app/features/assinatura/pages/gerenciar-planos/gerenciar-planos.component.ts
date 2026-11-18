import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { PlanoAssinatura } from 'src/app/shared/models/PlanoAssinatura';
import { mensagemErroAssinaturaAdmin } from 'src/app/shared/utils/mensagem-erro-http';
import { PlanoDescricaoParserService } from 'src/app/shared/utils/plano-descricao-parser.service';
import { ModalEditarPlanoComponent } from './modal-editar-plano/modal-editar-plano.component';
import { ModalValoresAdicionaisComponent } from './modal-valores-adicionais/modal-valores-adicionais.component';

/** Quantos recursos aparecem no card antes do "e mais N". */
const RECURSOS_VISIVEIS = 5;

/**
 * Tela do SUPER_ADMIN com os planos de assinatura.
 * O produto tem planos fixos (Starter, Profissional, Business): aqui só se edita e desativa,
 * não se cria plano (o back não tem POST /planos).
 */
@Component({
  selector: 'app-gerenciar-planos',
  templateUrl: './gerenciar-planos.component.html',
  styleUrls: ['../../tokens-assinatura.css', './gerenciar-planos.component.css']
})
export class GerenciarPlanosComponent implements OnInit {

  readonly RECURSOS_VISIVEIS = RECURSOS_VISIVEIS;

  planos: PlanoAssinatura[] = [];
  isLoading = true;
  erroCarregar = false;
  desativandoId: number | null = null;

  constructor(
    private planoApiService: PlanoApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private notificacao: NotificacaoService,
    private parser: PlanoDescricaoParserService
  ) {}

  ngOnInit(): void {
    this.carregarPlanos();
  }

  carregarPlanos(): void {
    this.isLoading = true;
    this.erroCarregar = false;
    this.planoApiService.listarPlanosAtivos().subscribe({
      next: (planos) => {
        this.planos = [...planos].sort((a, b) => a.valorMensal - b.valorMensal);
        this.isLoading = false;
      },
      error: () => {
        this.erroCarregar = true;
        this.isLoading = false;
      }
    });
  }

  /**
   * Abre o diálogo de edição do plano; recarrega a lista se salvou.
   * @param plano plano a editar
   */
  editarPlano(plano: PlanoAssinatura): void {
    this.dialog.open(ModalEditarPlanoComponent, {
      width: '760px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: { plano }
    }).afterClosed().subscribe(salvou => {
      if (salvou) { this.carregarPlanos(); }
    });
  }

  /** Abre a tabela de valores por usuário extra de todos os planos. */
  abrirModalValores(): void {
    this.dialog.open(ModalValoresAdicionaisComponent, {
      width: '820px',
      maxWidth: '95vw',
      data: { planos: this.planos }
    }).afterClosed().subscribe(result => {
      if (result) { this.carregarPlanos(); }
    });
  }

  /**
   * Pede confirmação e desativa o plano. Plano desativado some desta lista e da página de planos.
   * @param plano plano a desativar
   */
  desativarPlano(plano: PlanoAssinatura): void {
    this.notificacao.fire({
      icon: 'warning',
      title: `Desativar o plano ${this.escapar(plano.nome)}?`,
      html: 'Ele sai desta lista e da escolha de planos. Não há como reativá-lo por esta tela.',
      showCancelButton: true,
      cancelButtonText: 'Voltar',
      confirmButtonText: 'Desativar plano',
      confirmButtonColor: '#d33'
    }).then(r => {
      if (!r.isConfirmed) { return; }
      this.desativandoId = plano.id;
      this.planoApiService.desativarPlano(plano.id).subscribe({
        next: () => {
          this.desativandoId = null;
          this.snackBar.open(`Plano ${plano.nome} desativado.`, 'Fechar', { duration: 3000 });
          this.carregarPlanos();
        },
        error: (err) => {
          this.desativandoId = null;
          this.snackBar.open(mensagemErroAssinaturaAdmin(err, 'Não foi possível desativar o plano.'), 'Fechar', { duration: 5000 });
        }
      });
    });
  }

  formatarValor(valor: number | null): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Sem limite' : `${limite}`;
  }

  /**
   * Recursos do plano; planos antigos guardam a lista dentro da descrição.
   * @param plano plano
   * @returns lista de recursos
   */
  getRecursosFromPlano(plano: PlanoAssinatura): string[] {
    if (plano.recursos && plano.recursos.length > 0) {
      return plano.recursos;
    }
    return this.parser.parse(plano.descricao).recursos || [];
  }

  /**
   * Frase de destaque do plano, sem o "Recursos: [...]" que planos antigos têm na descrição.
   * @param plano plano
   * @returns frase curta
   */
  getPlanoDescricao(plano: PlanoAssinatura): string {
    if (plano.titulo && !plano.titulo.includes('Recursos:')) {
      return plano.titulo;
    }
    const titulo = this.parser.parse(plano.descricao).titulo || '';
    const corte = titulo.search(/\s*Recursos:/i);
    return (corte >= 0 ? titulo.slice(0, corte) : titulo).replace(/^titulo:\s*/i, '').trim();
  }

  trackPorId(_indice: number, plano: PlanoAssinatura): number {
    return plano.id;
  }

  /** O nome do plano entra no título do alerta (HTML): escapa para não injetar marcação. */
  private escapar(texto: string): string {
    return (texto || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }
}
