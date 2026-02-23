import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Usuario } from '../interfaces/usuario/usuario';
import { AuthService } from 'src/app/core/services/auth.service';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-barra-Latera',
  templateUrl: './barra-Latera.component.html',
  styleUrls: ['./barra-Latera.component.css'],
})
export class BarraLateraComponent implements OnInit, OnDestroy {


  // Estado do Sidebar
  isExpanded = false;
  isPinned = false;
  isMobileOpen = false;
  isConfigOpen = false;
  isCadastroOpen = false;
  activeRoute = '';
  isDarkMode = false;

  // Dados do usuário
  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
    nome: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private tokenService: tokenService,
    public ControleAcessoService: ControleAcessoApiService,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {

    // Observar dados do usuário
    const userSub = this.tokenService.UsuarioLogadoValue$.subscribe((usuario) => {
      if (usuario) this.UsuarioLogado = usuario;
    });
    this.subscriptions.push(userSub);

    // Observar mudanças de rota para destacar item ativo
    const routeSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveRoute(event.urlAfterRedirects);
      });
    this.subscriptions.push(routeSub);

    // Definir rota inicial
    this.updateActiveRoute(this.router.url);

    // Observar mudanças de tema
    const themeSub = this.themeService.currentTheme$.subscribe(
      (theme) => this.isDarkMode = theme.isDark
    );
    this.subscriptions.push(themeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Atualiza a rota ativa baseado na URL
  private updateActiveRoute(url: string): void {
    const routeMap: { [key: string]: string } = {
      '/Dashboard': 'Dashboard',
      '/Prontuario': 'prontuario',
      '/Dados-Medicos': 'DadosMedicos',
      '/gerenciamento': 'gerenciamento',
      '/Gerenciamento-Usuarios': 'Usuarios',
      '/trocaSenha': 'trocar_senha',
      '/Agenda-Medico': 'AgendaMedico',
      '/mensageria': 'Mensageria'
    };

    this.activeRoute = routeMap[url] || '';
  }

  getUserRole(): string {
    return this.ControleAcessoService.getTipoUsuarioDescricao();
  }

  getNomeExibicao(): string {
    // Prioriza o nome do usuário, fallback para o username (login)
    return this.UsuarioLogado.nome || this.UsuarioLogado.sub || 'Usuário';
  }

  // Expande sidebar no hover (desktop)
  onMouseEnter(): void {
    if (!this.isPinned && window.innerWidth > 768) {
      this.isExpanded = true;
    }
  }

  // Recolhe sidebar ao sair do hover (desktop)
  onMouseLeave(): void {
    if (!this.isPinned && window.innerWidth > 768) {
      this.isExpanded = false;
      this.isConfigOpen = false;
      this.isCadastroOpen = false;
    }
  }

  // Toggle para fixar/desfixar sidebar expandido
  toggleSidebar(): void {
    this.isPinned = !this.isPinned;
    this.isExpanded = this.isPinned;
  }

  // Toggle do submenu de configurações
  toggleConfig(): void {
    this.isConfigOpen = !this.isConfigOpen;
  }

  // Toggle do submenu de cadastros
  toggleCadastro(): void {
    this.isCadastroOpen = !this.isCadastroOpen;
  }

  // Abre menu mobile
  openMobileMenu(): void {
    this.isMobileOpen = true;
    this.isExpanded = true;
    document.body.style.overflow = 'hidden';
  }

  // Fecha menu mobile
  closeMobileMenu(): void {
    this.isMobileOpen = false;
    this.isExpanded = false;
    this.isConfigOpen = false;
    this.isCadastroOpen = false;
    document.body.style.overflow = '';
  }

  // Navegação unificada
  navigateTo(rota: string): void {
    const routes: { [key: string]: string } = {
      'Dashboard': 'Dashboard',
      'gerenciamento': 'gerenciamento',
      'cadastroPaciente': 'cadastroPaciente',
      'cadastroMedico': 'cadastroMedico',
      'cadastroSecretaria': 'cadastroSecretaria',
      'Usuarios': 'Gerenciamento-Usuarios',
      'prontuario': 'Prontuario',
      'pacientes': 'Pacientes',
      'DadosMedicos': 'Dados-Medicos',
      'trocar_senha': 'trocaSenha',
      'sistema': 'sistema',
      'suporte': 'suporte',
      'sobre': 'sobre',
      'AgendaMedico': 'Agenda-Medico',
      'startconsulta': 'startconsulta',
      'Mensageria': 'mensageria'
    };

    const route = routes[rota];
    if (route) {
      this.router.navigate([route]);
      this.activeRoute = rota;

      // Fecha menu mobile após navegação
      if (this.isMobileOpen) {
        this.closeMobileMenu();
      }
    }
  }

  // Fecha sidebar ao pressionar ESC
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isMobileOpen) {
      this.closeMobileMenu();
    }
  }

  // Verifica se está logado
  estaLogado(): boolean {
    return this.authService.isLoggedIn();
  }

  // Logout
  Deslogar(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }

  // Toggle do tema
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }


  navegarPara(arg0: string) {

    this.router.navigate([arg0]);
  }
}
