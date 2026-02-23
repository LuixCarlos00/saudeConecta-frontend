import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService, ThemeType, ThemeConfig, Theme } from 'src/app/services/theme/theme.service';
import {
  ConfiguracaoGraficoService,
  ConfiguracaoGraficoResponse,
  AtualizarConfiguracaoGraficoRequest
} from 'src/app/services/api/configuracao-grafico.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracoes-sistema',
  templateUrl: './configuracoes-sistema.component.html',
  styleUrls: ['./configuracoes-sistema.component.css']
})
export class ConfiguracoesSistemaComponent implements OnInit, OnDestroy {

  availableThemes: ThemeConfig[] = [];
  currentTheme: ThemeType = 'light';
  activeTab = 'graficos';
  configuracoes: ConfiguracaoGraficoResponse[] = [];
  loading = false;

  private themeSubscription?: Subscription;

  constructor(
    public themeService: ThemeService,
    private configuracaoGraficoService: ConfiguracaoGraficoService
  ) {
    this.availableThemes = this.themeService.availableThemes;
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(
      (theme: Theme) => this.currentTheme = theme.isDark ? 'dark-blue' : 'light'
    );
    this.carregarConfiguracoes();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  selectTheme(themeId: ThemeType): void { this.themeService.setTheme(themeId); }
  isThemeSelected(themeId: ThemeType): boolean { return this.currentTheme === themeId; }
  setActiveTab(tab: 'temas' | 'graficos'): void { this.activeTab = tab; }

  carregarConfiguracoes(): void {
    this.loading = true;
    // O backend extrai o usuário do JWT — nenhum parâmetro extra no frontend
    this.configuracaoGraficoService.listarConfiguracoes().subscribe({
      next: (configs) => {
        if (!configs || configs.length === 0) {
          this.inicializarConfiguracoesAutomaticamente();
        } else {
          this.configuracoes = configs;
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.mostrarErro('Não foi possível carregar as configurações dos gráficos');
      }
    });
  }

  private inicializarConfiguracoesAutomaticamente(): void {
    this.configuracaoGraficoService.inicializarConfiguracoes().subscribe({
      next: (configs) => {
        this.configuracoes = configs;
        this.loading = false;
        Swal.fire({
          icon: 'info',
          title: 'Configurações Inicializadas',
          text: 'Ative os gráficos que deseja visualizar no dashboard.',
          confirmButtonColor: '#0066CC',
          timer: 4000
        });
      },
      error: () => {
        this.loading = false;
        this.mostrarErro('Não foi possível inicializar as configurações');
      }
    });
  }

  toggleGrafico(config: ConfiguracaoGraficoResponse): void {
    const request: AtualizarConfiguracaoGraficoRequest = {
      tipoGrafico: config.tipoGrafico,
      ativo: !config.ativo,
      ordemExibicao: config.ordemExibicao
    };
    this.configuracaoGraficoService.atualizarConfiguracao(config.id, request).subscribe({
      next: (updated) => {
        const i = this.configuracoes.findIndex(c => c.id === updated.id);
        if (i !== -1) { this.configuracoes[i] = updated; }
        Swal.fire({ icon: 'success', title: `Gráfico ${updated.ativo ? 'ativado' : 'desativado'}`, timer: 2000, showConfirmButton: false });
      },
      error: () => this.mostrarErro('Não foi possível atualizar a configuração')
    });
  }

  salvarConfiguracoes(): void {
    this.loading = true;
    const requests: AtualizarConfiguracaoGraficoRequest[] = this.configuracoes.map(c => ({
      tipoGrafico: c.tipoGrafico, ativo: c.ativo, ordemExibicao: c.ordemExibicao
    }));
    this.configuracaoGraficoService.atualizarMultiplasConfiguracoes(requests).subscribe({
      next: (updated) => {
        this.configuracoes = updated;
        this.loading = false;
        Swal.fire({ icon: 'success', title: 'Configurações salvas', timer: 2000, showConfirmButton: false });
      },
      error: () => { this.loading = false; this.mostrarErro('Não foi possível salvar'); }
    });
  }

  resetarConfiguracoes(): void {
    Swal.fire({
      icon: 'warning',
      title: 'Confirmar Reset',
      text: 'Deseja realmente resetar todas as configurações para o padrão?',
      showCancelButton: true,
      confirmButtonColor: '#0066CC',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, resetar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) { return; }
      this.loading = true;
      this.configuracaoGraficoService.resetarConfiguracoesParaPadrao().subscribe({
        next: () => {
          this.carregarConfiguracoes();
          Swal.fire({ icon: 'success', title: 'Configurações resetadas', timer: 2000, showConfirmButton: false });
        },
        error: () => { this.loading = false; this.mostrarErro('Não foi possível resetar'); }
      });
    });
  }

  getGraficoIcon(tipo: string): string {
    const icons: Record<string, string> = {
      'CONSULTAS_POR_PERIODO': 'fa-chart-line',
      'AGENDAMENTOS_DIAS_SEMANA': 'fa-calendar-days',
      'SALDO_FINANCEIRO': 'fa-dollar-sign',
      'MEDICOS_POR_ESPECIALIDADE': 'fa-user-doctor',
      'MEDIA_TEMPO_CONSULTA': 'fa-clock',
      'AGENDAMENTOS_MEDICO_PERIODO': 'fa-calendar-week',
    };
    return icons[tipo] ?? 'fa-chart-bar';
  }

  private mostrarErro(texto: string): void {
    Swal.fire({ icon: 'error', title: 'Erro', text: texto, confirmButtonColor: '#0066CC' });
  }
}
