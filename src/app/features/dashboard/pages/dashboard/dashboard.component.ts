import { ProfissionalApiService } from 'src/app/core/data-access/profissional-api.service';
import { DashboardApiService } from 'src/app/core/data-access/dashboard-api.service';
import { ConfiguracaoCardService } from 'src/app/core/data-access/configuracao-card.service';
import { ControleAcessoApiService } from 'src/app/core/data-access/controle-acesso-api.service';
import { AssinaturaApiService } from 'src/app/core/data-access/assinatura-api.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ConfiguracaoGraficoDashboardService } from 'src/app/core/data-access/configuracao-grafico-dashboard.service';
import { ConfiguracaoGraficoDashboard, TipoGraficoDashboard, TipoCardDashboard } from 'src/app/shared/models/configuracao-grafico-dashboard.interface';
import { diasCalendarioAte } from 'src/app/shared/utils/data-local';
import { calcularDataSuspensao } from 'src/app/shared/constants/regua-cobranca.constant';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  today = new Date();
  /** true quando o usuário logado é SUPER_ADMIN: mostra o painel da plataforma em vez do da clínica. */
  superAdmin = false;

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

  // Status da assinatura (banner de inadimplência)
  assinaturaInadimplente = false;
  dataLimiteAcesso: Date | null = null;
  diasRestantes: number = 0;

  // Expor enums para o template
  TipoGraficoDashboard = TipoGraficoDashboard;
  TipoCardDashboard = TipoCardDashboard;

  readonly todosCards = [
    { tipo: TipoCardDashboard.CONSULTAS_HOJE,       icon: 'fa-calendar-check',  cor: 'blue',   label: 'Consultas hoje' },
    { tipo: TipoCardDashboard.CONSULTAS_ATENDIDAS,  icon: 'fa-user-check',      cor: 'green',  label: 'Atendidos hoje' },
    { tipo: TipoCardDashboard.CONSULTAS_AGUARDANDO, icon: 'fa-clock',           cor: 'orange', label: 'Aguardando' },
    { tipo: TipoCardDashboard.MEDICOS_ATIVOS,       icon: 'fa-user-doctor',     cor: 'cyan',   label: 'Cl\u00ednicos ativos' },
    { tipo: TipoCardDashboard.CONSULTAS_SEMANA,     icon: 'fa-calendar-week',   cor: 'purple', label: 'Consultas na semana' },
    { tipo: TipoCardDashboard.CANCELADOS_SEMANA,    icon: 'fa-calendar-xmark',  cor: 'red',    label: 'Canceladas na semana' },
    { tipo: TipoCardDashboard.CONFIRMADOS_SEMANA,   icon: 'fa-calendar-check',  cor: 'teal',   label: 'Confirmadas na semana' },
  ];

  constructor(
    public ControleAcessoService: ControleAcessoApiService,
    private router: Router,
    private consultaApiService: ConsultaApiService,
    private authService: AuthService,
    private configuracaoGraficoService: ConfiguracaoGraficoDashboardService,
    private profissionalApiService: ProfissionalApiService,
    private configuracaoCardService: ConfiguracaoCardService,
    private dashboardApiService: DashboardApiService,
    private assinaturaApiService: AssinaturaApiService
  ) { }

  ngOnInit(): void {
    // SUPER_ADMIN vê o painel da plataforma; as chamadas abaixo são de clínica (exigem tenant).
    this.superAdmin = this.ControleAcessoService.isSuperAdmin();
    if (this.superAdmin) { return; }
    this.verificarStatusAssinatura();
  }

  /** Carrega os dados do painel; só roda com a assinatura em dia (SUSPENSA devolve 403 em todas). */
  private carregarPainel(): void {
    this.carregarConfiguracoesGraficos();
    this.carregarConfiguracoesCards();
    this.carregarEstatisticas();
  }


  private carregarEstatisticas(): void {
    if (this.ControleAcessoService.isDashboardAdministrativo()) {
      this.carregarEstatisticasAdmin();
    } else if (this.ControleAcessoService.isDashboardProfissional()) {
      this.carregarEstatisticasMedico();
    }
  }


  
  private carregarEstatisticasAdmin(): void {
    this.carregandoEstatisticas = true;
    const organizacaoId = this.authService.getOrganizacaoId();
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
    this.carregandoEstatisticas = true;
    const usuarioLogado = this.authService.getCurrentUser();
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

  /**
   * Verifica o status da assinatura (banner de inadimplência).
   * A notificação de cobrança pendente (sino) é tratada globalmente
   * pela barra superior (BarraSuperiorComponent).
   */
  private verificarStatusAssinatura(): void {
    if (this.ControleAcessoService.isSuperAdmin()) return;

    this.assinaturaApiService.minhaAssinatura().subscribe({
      next: (assinatura) => {
        if (assinatura.status === 'SUSPENSA') {
          // Sem acesso ao painel: evita a enxurrada de 403. Só quem pode abrir /minha-assinatura
          // é levado para lá (os demais perfis cairiam no RoleGuard, que manda ao login).
          if (this.authService.isOrgAdmin() || this.authService.isRecepcionista()) {
            this.router.navigate(['/minha-assinatura']);
          }
          return;
        }
        this.carregarPainel();
        if (assinatura.status === 'INADIMPLENTE') {
          this.assinaturaInadimplente = true;
          const dataLimite = calcularDataSuspensao(assinatura.dataVencimento);
          if (dataLimite) {
            this.dataLimiteAcesso = dataLimite;
            this.diasRestantes = Math.max(0, diasCalendarioAte(dataLimite));
          }
        }
      },
      error: (err) => {
        console.warn('Não foi possível verificar status da assinatura:', err);
        this.carregarPainel();
      }
    });
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
