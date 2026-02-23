import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { Subscription, forkJoin } from 'rxjs';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ConfiguracaoGraficoDashboardService } from 'src/app/core/services/configuracao-grafico-dashboard.service';
import { ConfiguracaoGraficoDashboard, TipoGraficoDashboard } from 'src/app/shared/models/configuracao-grafico-dashboard.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
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
  carregandoEstatisticas: boolean = true;

  // Configurações de Gráficos
  configuracoes: ConfiguracaoGraficoDashboard[] = [];
  graficosAtivos: Map<TipoGraficoDashboard, boolean> = new Map();
  carregandoConfiguracoes: boolean = true;

  // Expor enum para o template
  TipoGraficoDashboard = TipoGraficoDashboard;

  constructor(
    public ControleAcessoService: ControleAcessoApiService,
    private router: Router,
    public themeService: ThemeService,
    private consultaApiService: ConsultaApiService,
    private tokenService: tokenService,
    private configuracaoGraficoService: ConfiguracaoGraficoDashboardService
  ) { }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(
      (theme) => this.isDarkMode = theme.isDark
    );
    this.carregarConfiguracoesGraficos();
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
    if (organizacaoId) {// Se o usuario tiver um ID de organização, carrega as estatísticas específicas da organização
      forkJoin({
        consultasHoje: this.consultaApiService.buscarEstatisticasConsultasHojePorOrganizacao(organizacaoId),
        consultasAtendidas: this.consultaApiService.buscarEstatisticasRealizadasHojePorOrganizacao(organizacaoId),
        consultasAguardando: this.consultaApiService.buscarEstatisticasAgendadasHojePorOrganizacao(organizacaoId),
        medicosAtivos: this.consultaApiService.buscarEstatisticasMedicosAtivosPorOrganizacao(organizacaoId),
      }).subscribe({
        next: (r) => {
          this.consultasHoje = r.consultasHoje;
          this.consultasAtendidas = r.consultasAtendidas;
          this.consultasAguardando = r.consultasAguardando;
          this.medicosAtivos = r.medicosAtivos;
          this.carregandoEstatisticas = false;
        },
        error: (erro) => {
          console.error('Erro ao carregar estatísticas da organização:', erro);
          this.carregandoEstatisticas = false;
        },
      });
    } else {// Se não tiver um ID de organização, carrega as estatísticas globais (admin geral)
      forkJoin({
        consultasHoje: this.consultaApiService.buscarEstatisticasConsultasHoje(),
        consultasAtendidas: this.consultaApiService.buscarEstatisticasRealizadasHoje(),
        consultasAguardando: this.consultaApiService.buscarEstatisticasAgendadasHoje(),
        medicosAtivos: this.consultaApiService.buscarEstatisticasMedicosAtivos(),
      }).subscribe({
        next: (r) => {
          this.consultasHoje = r.consultasHoje;
          this.consultasAtendidas = r.consultasAtendidas;
          this.consultasAguardando = r.consultasAguardando;
          this.medicosAtivos = r.medicosAtivos;
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
      consultasHoje: this.consultaApiService.buscarEstatisticasConsultasHojePorProfissional(usuarioId),
      consultasAtendidas: this.consultaApiService.buscarEstatisticasRealizadasHojePorProfissional(usuarioId),
      consultasAguardando: this.consultaApiService.buscarEstatisticasAgendadasHojePorProfissional(usuarioId),
      consultasSemana: this.consultaApiService.buscarEstatisticasSemanaPorProfissional(usuarioId),
    }).subscribe({
      next: (r) => {
        this.consultasHoje = r.consultasHoje;
        this.consultasAtendidas = r.consultasAtendidas;
        this.consultasAguardando = r.consultasAguardando;
        this.consultasSemana = r.consultasSemana;
        this.carregandoEstatisticas = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar estatísticas do médico:', erro);
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
}
