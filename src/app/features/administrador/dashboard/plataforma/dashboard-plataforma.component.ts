import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject, finalize, takeUntil } from 'rxjs';

import {
  ClinicaAtencao,
  DashboardPlataforma,
  PlataformaDashboardApiService
} from 'src/app/services/api/plataforma-dashboard-api.service';
import { ThemeService } from 'src/app/core/theme/theme.service';
import { extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';
import { formatarDataBr } from 'src/app/shared/utils/data-local';
import {
  graficoClinicasPorPlano,
  graficoConsultasMensais,
  graficoMrrPorPlano,
  graficoNovasVsCancelamentos,
  graficoReceitaMensal,
  graficoStatus,
  graficoUsuariosPorPerfil,
  lerPaletaDoTema
} from './plataforma-graficos';
import {
  formatarInteiro,
  formatarMoeda,
  ROTULO_MOTIVO,
  ROTULO_STATUS,
  variacaoPercentual
} from './plataforma-formatadores';

Chart.register(...registerables);

/** Configuração pronta de um gráfico para o `baseChart` do ng2-charts. */
export interface ConfiguracaoGrafico<T extends ChartType> {
  data: ChartConfiguration<T>['data'];
  options: NonNullable<ChartConfiguration<T>['options']>;
}

/** Sentido da variação da receita, usado para a cor/seta do KPI. */
export type SentidoVariacao = 'alta' | 'queda' | 'estavel' | 'sem-base';

/**
 * Dashboard da plataforma para o SUPER_ADMIN: saúde do negócio (clínicas, receita,
 * cobrança e uso) a partir de GET /plataforma/dashboard.
 */
@Component({
  selector: 'app-dashboard-plataforma',
  templateUrl: './dashboard-plataforma.component.html',
  styleUrls: ['./dashboard-plataforma.component.css']
})
export class DashboardPlataformaComponent implements OnInit, OnDestroy {

  readonly periodos: number[] = [6, 12, 24];
  readonly formatarMoeda = formatarMoeda;
  readonly formatarInteiro = formatarInteiro;
  readonly rotuloMotivo = ROTULO_MOTIVO;
  readonly rotuloStatus = ROTULO_STATUS;
  readonly formatarData = formatarDataBr;

  meses = 12;
  dados: DashboardPlataforma | null = null;
  carregando = false;
  erro: string | null = null;

  graficoStatus?: ConfiguracaoGrafico<'doughnut'>;
  graficoClinicasPlano?: ConfiguracaoGrafico<'bar'>;
  graficoMrrPlano?: ConfiguracaoGrafico<'bar'>;
  graficoReceita?: ConfiguracaoGrafico<'bar'>;
  graficoNovasCancelamentos?: ConfiguracaoGrafico<'line'>;
  graficoConsultas?: ConfiguracaoGrafico<'bar'>;
  graficoUsuarios?: ConfiguracaoGrafico<'bar'>;

  private readonly destroy$ = new Subject<void>();
  private readonly cancelaRequisicao$ = new Subject<void>();

  constructor(
    private plataformaApi: PlataformaDashboardApiService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.carregar();
    // O tema muda cores de texto/grade dos gráficos: reconstrói quando alternar claro/escuro.
    this.themeService.currentTheme$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.dados) { this.montarGraficos(this.dados); }
    });
  }

  ngOnDestroy(): void {
    this.cancelaRequisicao$.next();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Busca o dashboard com a janela de meses atual; descarta resposta de chamada anterior. */
  carregar(): void {
    this.cancelaRequisicao$.next();
    this.carregando = true;
    this.erro = null;
    this.plataformaApi.buscar(this.meses)
      .pipe(
        takeUntil(this.cancelaRequisicao$),
        takeUntil(this.destroy$),
        finalize(() => (this.carregando = false))
      )
      .subscribe({
        next: dados => {
          this.dados = dados;
          this.montarGraficos(dados);
        },
        error: err => {
          this.erro = extrairMensagemErro(err) || 'Não foi possível carregar o dashboard da plataforma.';
        }
      });
  }

  /**
   * Troca a janela das séries mensais e refaz a chamada.
   *
   * @param meses 6, 12 ou 24
   */
  selecionarPeriodo(meses: number): void {
    if (meses === this.meses && !this.erro) { return; }
    this.meses = meses;
    this.carregar();
  }

  /** Plataforma sem nenhuma clínica cadastrada. */
  get vazio(): boolean {
    return !!this.dados && this.dados.resumo.clinicasTotal === 0;
  }

  /** Inadimplentes + suspensas (KPI de alerta). */
  get inadimplentesESuspensas(): number {
    return this.dados ? this.dados.resumo.inadimplentes + this.dados.resumo.suspensas : 0;
  }

  /** Variação % da receita do mês sobre o anterior; null quando o mês anterior é zero. */
  get variacaoReceita(): number | null {
    return this.dados ? variacaoPercentual(this.dados.resumo.receitaMesAtual, this.dados.resumo.receitaMesAnterior) : null;
  }

  /** Sentido da variação para seta/cor. */
  get sentidoVariacao(): SentidoVariacao {
    const v = this.variacaoReceita;
    if (v === null) { return 'sem-base'; }
    if (v > 0) { return 'alta'; }
    if (v < 0) { return 'queda'; }
    return 'estavel';
  }

  /** Texto da variação (ex.: "12,5%"), sem sinal: a seta indica o sentido. */
  get textoVariacao(): string {
    const v = this.variacaoReceita;
    return v === null ? '' : `${Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }

  /** Hora "HH:mm" de `geradoEm` (ISO sem fuso, já em horário de Brasília). */
  get atualizadoAs(): string {
    const m = /T(\d{2}):(\d{2})/.exec(this.dados?.geradoEm ?? '');
    return m ? `${m[1]}:${m[2]}` : '';
  }

  /** Classe do badge de cada motivo de atenção. */
  classeMotivo(item: ClinicaAtencao): string {
    return `badge badge--${item.motivo.toLowerCase().replace(/_/g, '-')}`;
  }

  /** Rótulo legível do motivo de atenção. */
  textoMotivo(item: ClinicaAtencao): string {
    return this.rotuloMotivo[item.motivo];
  }

  /** Só dá para abrir a clínica quando o item tem organização (pendência manual não tem). */
  temLink(item: ClinicaAtencao): boolean {
    return item.organizacaoId !== null && item.organizacaoId !== undefined;
  }

  /** Query params da tela que gerencia a assinatura da clínica (modal de plano em Gerenciamento-Usuarios). */
  queryParamsClinica(organizacaoId: number, nome: string): { organizacaoId: number; nome: string } {
    return { organizacaoId, nome };
  }

  trackPorOrganizacao(indice: number, item: { organizacaoId: number | null }): number | string {
    return item.organizacaoId ?? `item-${indice}`;
  }

  private montarGraficos(d: DashboardPlataforma): void {
    const paleta = lerPaletaDoTema();
    this.graficoStatus = graficoStatus(d, paleta);
    this.graficoClinicasPlano = graficoClinicasPorPlano(d, paleta);
    this.graficoMrrPlano = graficoMrrPorPlano(d, paleta);
    this.graficoReceita = graficoReceitaMensal(d, paleta);
    this.graficoNovasCancelamentos = graficoNovasVsCancelamentos(d, paleta);
    this.graficoConsultas = graficoConsultasMensais(d, paleta);
    this.graficoUsuarios = graficoUsuariosPorPerfil(d, paleta);
  }
}
