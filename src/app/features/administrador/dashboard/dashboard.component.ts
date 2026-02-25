import { ProfissionalApiService } from './../../../services/api/profissional-api.service';
import { DashboardApiService } from 'src/app/services/api/dashboard-api.service';
import { ConfiguracaoCardService } from 'src/app/services/api/configuracao-card.service';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { Subscription, forkJoin } from 'rxjs';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ConfiguracaoGraficoDashboardService } from 'src/app/core/services/configuracao-grafico-dashboard.service';
import { ConfiguracaoGraficoDashboard, TipoGraficoDashboard, TipoCardDashboard } from 'src/app/shared/models/configuracao-grafico-dashboard.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('cardSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  today = new Date();
  isDarkMode = false;
  private themeSubscription?: Subscription;

  // Estatísticas do Dashboard
  consultasHoje: number = 0;
  consultasAtendidas: number = 0;
  consultasAguardando: number = 0;
  medicosAtivos: number = 0;
  consultasSemana: number = 0;
  canceladosSemana: number = 0;
  confirmadosSemana: number = 0;
  carregandoEstatisticas: boolean = true;

  // Configurações de Gráficos
  configuracoes: ConfiguracaoGraficoDashboard[] = [];
  graficosAtivos: Map<TipoGraficoDashboard, boolean> = new Map();
  carregandoConfiguracoes: boolean = true;

  // Configurações de Cards
  cardsAtivos: Map<TipoCardDashboard, boolean> = new Map();
  carregandoCards: boolean = true;

  // Carrossel de cards
  carrosselOffset: number = 0;
  readonly CARDS_POR_PAGINA = 5;

  // Expor enums para o template
  TipoGraficoDashboard = TipoGraficoDashboard;
  TipoCardDashboard = TipoCardDashboard;

  readonly todosCards = [
    { tipo: TipoCardDashboard.CONSULTAS_HOJE,       icon: 'fa-calendar-check',  cor: 'blue',   label: 'Total Hoje' },
    { tipo: TipoCardDashboard.CONSULTAS_ATENDIDAS,  icon: 'fa-user-check',      cor: 'green',  label: 'Atendidos' },
    { tipo: TipoCardDashboard.CONSULTAS_AGUARDANDO, icon: 'fa-clock',           cor: 'orange', label: 'Aguardando' },
    { tipo: TipoCardDashboard.MEDICOS_ATIVOS,       icon: 'fa-user-doctor',     cor: 'cyan',   label: 'Cl\u00ednicos Ativos' },
    { tipo: TipoCardDashboard.CONSULTAS_SEMANA,     icon: 'fa-calendar-week',   cor: 'purple', label: 'Esta Semana' },
    { tipo: TipoCardDashboard.CANCELADOS_SEMANA,    icon: 'fa-calendar-xmark',  cor: 'red',    label: 'Cancelados (Semana)' },
    { tipo: TipoCardDashboard.CONFIRMADOS_SEMANA,   icon: 'fa-calendar-check',  cor: 'teal',   label: 'Confirmados (Semana)' },
  ];

  constructor(
    public ControleAcessoService: ControleAcessoApiService,
    private router: Router,
    public themeService: ThemeService,
    private consultaApiService: ConsultaApiService,
    private tokenService: tokenService,
    private configuracaoGraficoService: ConfiguracaoGraficoDashboardService,
    private profissionalApiService: ProfissionalApiService,
    private configuracaoCardService: ConfiguracaoCardService,
    private dashboardApiService: DashboardApiService
  ) { }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(
      (theme) => this.isDarkMode = theme.isDark
    );
    this.carregarConfiguracoesGraficos();
    this.carregarConfiguracoesCards();
    this.carregarEstatisticas();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  private carregarEstatisticas(): void {
    if (this.ControleAcessoService.isDashboardAdministrativo()) {
      this.carregarEstatisticasAdmin();
    } else if (this.ControleAcessoService.isDashboardProfissional()) {
      this.carregarEstatisticasMedico();
    }
  }


  
  private carregarEstatisticasAdmin(): void {
    console.log('Carregando estatísticas para dashboard administrativo');
    this.carregandoEstatisticas = true;
    const organizacaoId = this.tokenService.obterOrganizacaoId();
    console.log('Carregando estatísticas para organização ID:', organizacaoId);
    if (organizacaoId) {
      forkJoin({
        consultas: this.consultaApiService.getEstatisticasDashboardAdminOrg(organizacaoId),
        medicosAtivos: this.profissionalApiService.getEstatisticasMedicosAtivosByOrg(organizacaoId),
      }).subscribe({
        next: (r) => {
          this.consultasHoje = r.consultas.consultasHoje;
          this.consultasAtendidas = r.consultas.consultasAtendidas;
          this.consultasAguardando = r.consultas.consultasAguardando;
          this.consultasSemana = r.consultas.consultasSemana;
          this.canceladosSemana = r.consultas.canceladosSemana;
          this.confirmadosSemana = r.consultas.confirmadosSemana;
          this.medicosAtivos = r.medicosAtivos;
          this.carregandoEstatisticas = false;
        },
        error: (erro) => {
          console.error('Erro ao carregar estatísticas da organização:', erro);
          this.carregandoEstatisticas = false;
        },
      });
    } else {
      forkJoin({
        consultas: this.dashboardApiService.getEstatisticasDashboardSuperAdmin(),
        medicosAtivos: this.profissionalApiService.getEstatisticasMedicosAtivosGlobal(),
      }).subscribe({
        next: (r) => {
          this.consultasHoje       = r.consultas.consultasHoje;
          this.consultasAtendidas  = r.consultas.consultasAtendidas;
          this.consultasAguardando = r.consultas.consultasAguardando;
          this.consultasSemana     = r.consultas.consultasSemana;
          this.canceladosSemana    = r.consultas.canceladosSemana;
          this.confirmadosSemana   = r.consultas.confirmadosSemana;
          this.medicosAtivos       = r.medicosAtivos;
          this.carregandoEstatisticas = false;
        },
        error: (erro) => {
          console.error('Erro ao carregar estatísticas globais:', erro);
          this.carregandoEstatisticas = false;
        },
      });
    }
  }

  private carregarEstatisticasMedico(): void {
    console.log('Carregando estatísticas para dashboard profissional');
    this.carregandoEstatisticas = true;
    const usuarioLogado = this.tokenService.getUsuarioLogado();
    console.log('Usuário logado:', usuarioLogado);
    if (!usuarioLogado?.id) {
      console.error('Usuário não logado');
      this.carregandoEstatisticas = false;
      return;
    }
    this.carregarDadosPorUsuario(Number(usuarioLogado.id));
  }

  private carregarDadosPorUsuario(usuarioId: number): void {
    forkJoin({
      consultas: this.dashboardApiService.getEstatisticasDashboardProfissional(usuarioId),
    }).subscribe({
      next: (r) => {
        this.consultasHoje       = r.consultas.consultasHoje;
        this.consultasAtendidas  = r.consultas.consultasAtendidas;
        this.consultasAguardando = r.consultas.consultasAguardando;
        this.consultasSemana     = r.consultas.consultasSemana;
        this.canceladosSemana    = r.consultas.canceladosSemana;
        this.confirmadosSemana   = r.consultas.confirmadosSemana;
        this.carregandoEstatisticas = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar estatísticas do profissional:', erro);
        this.carregandoEstatisticas = false;
      },
    });
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  navegarPara(rota: string): void {
    this.router.navigate([rota]);
  }

  private carregarConfiguracoesGraficos(): void {
    this.carregandoConfiguracoes = true;
    this.configuracaoGraficoService.listarGraficosAtivos().subscribe({
      next: (configs) => {
        this.configuracoes = configs;
        this.graficosAtivos.clear();
        configs.forEach(config => this.graficosAtivos.set(config.tipoGrafico, config.ativo));
        this.carregandoConfiguracoes = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar configurações de gráficos:', erro);
        this.carregandoConfiguracoes = false;
        // Fallback: ativa todos os gráficos (admin + profissional)
        Object.values(TipoGraficoDashboard).forEach(tipo =>
          this.graficosAtivos.set(tipo as TipoGraficoDashboard, true)
        );
      },
    });
  }

  isGraficoAtivo(tipo: TipoGraficoDashboard): boolean {
    return this.graficosAtivos.get(tipo) === true;
  }

  get cardsVisiveis() {
    return this.todosCards.filter(c => this.isCardAtivo(c.tipo));
  }

  get cardsNaPagina() {
    return this.cardsVisiveis.slice(this.carrosselOffset, this.carrosselOffset + this.CARDS_POR_PAGINA);
  }

  get podePrev(): boolean { return this.carrosselOffset > 0; }
  get podeNext(): boolean { return this.carrosselOffset + this.CARDS_POR_PAGINA < this.cardsVisiveis.length; }

  minVal(a: number, b: number): number { return Math.min(a, b); }

  carrosselAnterior(): void {
    if (this.podePrev) { this.carrosselOffset--; }
  }

  carrosselProximo(): void {
    if (this.podeNext) { this.carrosselOffset++; }
  }

  getValorCard(tipo: TipoCardDashboard): number {
    const map: Record<TipoCardDashboard, number> = {
      [TipoCardDashboard.CONSULTAS_HOJE]:       this.consultasHoje,
      [TipoCardDashboard.CONSULTAS_ATENDIDAS]:  this.consultasAtendidas,
      [TipoCardDashboard.CONSULTAS_AGUARDANDO]: this.consultasAguardando,
      [TipoCardDashboard.MEDICOS_ATIVOS]:       this.medicosAtivos,
      [TipoCardDashboard.CONSULTAS_SEMANA]:     this.consultasSemana,
      [TipoCardDashboard.CANCELADOS_SEMANA]:    this.canceladosSemana,
      [TipoCardDashboard.CONFIRMADOS_SEMANA]:   this.confirmadosSemana,
    };
    return map[tipo] ?? 0;
  }

  isCardAtivo(tipo: TipoCardDashboard): boolean {
    if (this.carregandoCards) { return true; }
    return this.cardsAtivos.get(tipo) !== false;
  }

  private carregarConfiguracoesCards(): void {
    this.carregandoCards = true;
    this.configuracaoCardService.listarCardsAtivos().subscribe({
      next: (configs) => {
        this.cardsAtivos.clear();
        Object.values(TipoCardDashboard).forEach(tipo =>
          this.cardsAtivos.set(tipo as TipoCardDashboard, false)
        );
        configs.forEach(config =>
          this.cardsAtivos.set(config.tipoCard as TipoCardDashboard, true)
        );
        this.carregandoCards = false;
      },
      error: () => {
        Object.values(TipoCardDashboard).forEach(tipo =>
          this.cardsAtivos.set(tipo as TipoCardDashboard, true)
        );
        this.carregandoCards = false;
      },
    });
  }
}
