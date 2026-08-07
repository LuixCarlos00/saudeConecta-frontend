import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { CobrancaApiService } from 'src/app/services/api/cobranca-api.service';
import { CobrancaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { Usuario } from '../interfaces/usuario/usuario';

/**
 * Barra superior fixa, exibida em todas as rotas da área logada.
 * Mostra: dados do usuário logado, data atual e notificações
 * (cobrança pendente da assinatura, quando aplicável ao AdminOrg).
 */
@Component({
  selector: 'app-barra-superior',
  templateUrl: './barra-superior.component.html',
  styleUrls: ['./barra-superior.component.css'],
})
export class BarraSuperiorComponent implements OnInit, OnDestroy {

  today = new Date();

  // Dados do usuário
  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
    nome: ''
  };

  // Notificação de cobrança pendente (apenas AdminOrg)
  cobrancaPendente: CobrancaTenant | null = null;
  assinaturaInadimplente = false;
  diasRestantesPagamento = 0;
  mostrarNotificacaoCobranca = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private tokenService: tokenService,
    public ControleAcessoService: ControleAcessoApiService,
    private assinaturaApiService: AssinaturaApiService,
    private cobrancaApiService: CobrancaApiService,
    private router: Router,
    private elementRef: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.mostrarNotificacaoCobranca) {
      return;
    }
    const clicouDentro = this.elementRef.nativeElement
      .querySelector('.notification-bell-wrapper')?.contains(event.target as Node);
    if (!clicouDentro) {
      this.mostrarNotificacaoCobranca = false;
    }
  }

  ngOnInit(): void {
    const userSub = this.tokenService.UsuarioLogadoValue$.subscribe((usuario) => {
      if (usuario) this.UsuarioLogado = usuario;
    });
    this.subscriptions.push(userSub);

    this.verificarStatusAssinatura();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getNomeExibicao(): string {
    return this.UsuarioLogado.nome || this.UsuarioLogado.sub || 'Usuário';
  }

  getUserRole(): string {
    return this.ControleAcessoService.getTipoUsuarioDescricao();
  }

  /**
   * Verifica cobrança pendente da assinatura da organização.
   * Restrito ao AdminOrg (SUPER_ADMIN não possui assinatura própria).
   */
  private verificarStatusAssinatura(): void {
    if (!this.ControleAcessoService.isAdmin() || this.ControleAcessoService.isSuperAdmin()) {
      return;
    }

    forkJoin({
      assinatura: this.assinaturaApiService.minhaAssinatura(),
      cobranca: this.cobrancaApiService.buscarCobrancaPendenteAtual()
    }).subscribe({
      next: ({ assinatura, cobranca }) => {
        this.assinaturaInadimplente = assinatura.status === 'INADIMPLENTE';

        if (cobranca && cobranca.status === 'PENDENTE') {
          this.cobrancaPendente = cobranca;
          const dataVencimento = new Date(cobranca.dataVencimentoPix);
          const hoje = new Date();
          const diffMs = dataVencimento.getTime() - hoje.getTime();
          this.diasRestantesPagamento = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
      },
      error: (err) => console.warn('Não foi possível verificar status da assinatura:', err)
    });
  }

  toggleNotificacaoCobranca(): void {
    this.mostrarNotificacaoCobranca = !this.mostrarNotificacaoCobranca;
  }

  fecharNotificacaoCobranca(): void {
    this.mostrarNotificacaoCobranca = false;
  }

  navegarPara(rota: string): void {
    this.router.navigate([rota]);
    this.mostrarNotificacaoCobranca = false;
  }
}
