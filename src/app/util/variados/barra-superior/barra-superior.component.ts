import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { AssinaturaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { diasCalendarioAte } from 'src/app/shared/utils/data-local';
import { Usuario } from '../interfaces/usuario/usuario';

/**
 * Barra superior fixa, exibida em todas as rotas da área logada.
 * Mostra: dados do usuário logado, data atual e notificações
 * (fim do período gratuito e inadimplência, quando aplicável ao AdminOrg).
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

  // Notificação de assinatura (apenas AdminOrg)
  assinatura: AssinaturaTenant | null = null;
  assinaturaInadimplente = false;
  trialPendenteAtivacao = false;
  diasRestantesTrial = 0;
  mostrarNotificacaoCobranca = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    public ControleAcessoService: ControleAcessoApiService,
    private assinaturaApiService: AssinaturaApiService,
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
    const userSub = this.authService.currentUser$.subscribe((usuario) => {
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
   * Verifica o status da assinatura da organização para alertar sobre o fim do
   * período gratuito. Restrito ao AdminOrg (SUPER_ADMIN não possui assinatura própria).
   */
  private verificarStatusAssinatura(): void {
    if (!this.ControleAcessoService.isAdmin() || this.ControleAcessoService.isSuperAdmin()) {
      return;
    }

    this.assinaturaApiService.minhaAssinatura().subscribe({
      next: (assinatura) => {
        this.assinatura = assinatura;
        this.assinaturaInadimplente = assinatura.status === 'INADIMPLENTE';

        if (assinatura.status === 'TRIAL' && !assinatura.cortesia) {
          this.trialPendenteAtivacao = true;
          this.diasRestantesTrial = this.calcularDiasRestantes(assinatura.dataVencimento);
        }
      },
      error: (err) => console.warn('Não foi possível verificar status da assinatura:', err)
    });
  }

  /**
   * Calcula quantos dias de calendário faltam até a data informada.
   *
   * @param data data alvo 'yyyy-MM-dd'
   * @returns dias restantes (nunca negativo)
   */
  private calcularDiasRestantes(data: string): number {
    return Math.max(0, diasCalendarioAte(data));
  }

  toggleNotificacaoCobranca(): void {
    this.mostrarNotificacaoCobranca = !this.mostrarNotificacaoCobranca;
  }

  navegarPara(rota: string): void {
    this.router.navigate([rota]);
    this.mostrarNotificacaoCobranca = false;
  }
}
