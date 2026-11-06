import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, take, filter } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { ConsultaStateService } from 'src/app/features/agenda/data-access/consulta-state.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ControleAcessoApiService } from 'src/app/core/data-access/controle-acesso-api.service';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { Usuario } from 'src/app/shared/models/usuario';
import { AgendarConsultaComponent } from 'src/app/features/agenda/components/agendar-consulta/agendar-consulta.component';
import { AcoesConsultaService } from '../../data-access/acoes-consulta.service';
import { RascunhoAtendimentoApiService } from 'src/app/core/data-access/rascunho-atendimento-api.service';
import { ConfiguracoesConsultaApiService, ConfiguracoesConsulta } from 'src/app/features/agenda/data-access/configuracoes-consulta-api.service';
import { formatarDataLocal } from 'src/app/shared/utils/data-local';
import {
  DiaCalendario,
  FiltrosAgenda,
  HoraDia,
  STATUS_FINALIZADAS,
  STATUS_AGENDADAS,
  STATUS_OPCOES,
  TipoVisualizacao,
  deslocarPeriodo,
  extrairProfissionaisEEspecialidades,
  filtrarConsultas,
  gerarDiasMes,
  gerarDiasSemana,
  gerarHorasDia,
  legendaDoTipo,
  tituloDoPeriodo,
} from './agenda-calendario.calculos';

/**
 * Tela da agenda: cabeçalho, painel de filtros, navegação por período e carga das consultas.
 * A grade (mês, semana ou dia) e o drawer de detalhes são componentes filhos; a lógica de
 * filtros, grades e datas fica em agenda-calendario.calculos.ts.
 */
@Component({
  selector: 'app-agenda-calendario',
  templateUrl: './agenda-calendario.component.html',
  styleUrls: ['./agenda-calendario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaCalendarioComponent implements OnInit, OnDestroy {

  // Estado da visualização
  tipoVisualizacao: TipoVisualizacao = 'mes';
  dataAtual: Date = new Date();
  dataSelecionada: Date = new Date();

  // Dados
  todasConsultas: Consultav2[] = [];
  consultasFiltradas: Consultav2[] = [];
  diasCalendario: DiaCalendario[] = [];
  diasSemana: DiaCalendario[] = [];
  horasDia: HoraDia[] = [];

  // Filtros
  filtroFinalizadas: boolean = false;
  filtroBusca: string = '';
  filtroProfissional: string = '';
  filtroEspecialidade: string = '';
  filtroStatusSelecionados: string[] = [];
  profissionaisDisponiveis: { id: number; nome: string }[] = [];
  especialidadesDisponiveis: string[] = [];
  planejamentosAssinados = new Set<number>();
  questionariosRespondidos = new Set<number>();
  /** IDs das consultas que já têm rascunho de atendimento (uma chamada por carregamento da tela). */
  consultasComRascunho = new Set<number>();

  readonly statusOpcoes = STATUS_OPCOES;
  readonly STATUS_FINALIZADAS = STATUS_FINALIZADAS;
  readonly STATUS_AGENDADAS = STATUS_AGENDADAS;

  get legendaAtual() {
    return legendaDoTipo(this.filtroFinalizadas);
  }

  // Drawer / evento selecionado
  consultaSelecionada: Consultav2 | null = null;
  popoverAberto = false;

  // Estado
  filtrosRecolhidos = false;
  carregando = false;
  tituloAtual = '';
  UsuarioLogado: Usuario = { id: 0, aud: '', exp: '', iss: '', sub: '', nome: '' };

  // Configuração de fluxo de consulta
  dropdownConfigAberto = false;
  pularParaConfirmado = false;
  configuracaoFluxo: ConfiguracoesConsulta | null = null;

  // Referência para o event listener
  private dropdownClickListener: any;

  private destroy$ = new Subject<void>();

  constructor(
    private notificacao: NotificacaoService,
    private consultaService: ConsultaApiService,
    private consultaState: ConsultaStateService,
    private authService: AuthService,
    public controleAcesso: ControleAcessoApiService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private acoesConsulta: AcoesConsultaService,
    private configuracoesConsultaService: ConfiguracoesConsultaApiService,
    private rascunhoApi: RascunhoAtendimentoApiService,
  ) {}

  ngOnInit(): void {
    this.atualizarTitulo();
    this.carregarConfiguracaoFluxo();
    this.authService.currentUser$
      .pipe(
        filter(u => !!u && !!u.id),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(usuario => {
        this.UsuarioLogado = usuario!;
        this.carregarConsultas();
        this.carregarRascunhos();
      });

    this.consultaState.cadastroRealizado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dados => {
        if (dados) { this.carregarConsultas(); }
      });

    this.consultaState.dadosCronologia$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dados => {
        if (dados) { this.carregarConsultas(); }
      });

    // Fechar dropdown ao clicar fora
    this.dropdownClickListener = () => {
      if (this.dropdownConfigAberto) {
        this.dropdownConfigAberto = false;
        this.cdr.markForCheck();
      }
    };
    document.addEventListener('click', this.dropdownClickListener);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dropdownClickListener) {
      document.removeEventListener('click', this.dropdownClickListener);
    }
  }

  // ========== CARREGAMENTO ==========

  carregarConsultas(): void {
    if (this.carregando) return;
    this.carregando = true;
    this.cdr.markForCheck();

    const dataRef = formatarDataLocal(this.dataAtual);
    const request$ = this.tipoVisualizacao === 'dia'
      ? this.consultaService.buscarDoDiaAtual(dataRef)
      : this.tipoVisualizacao === 'semana'
        ? this.consultaService.buscarDaSemanaAtual(dataRef)
        : this.consultaService.buscarDoMesAtual(dataRef);
    request$.pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (consultas) => {
          this.todasConsultas = consultas;
          this.extrairProfissionais();
          this.aplicarFiltros();
          if (this.filtroFinalizadas) {
            this.acoesConsulta.verificarPlanejamentosAssinados(this.todasConsultas, this.planejamentosAssinados, this.destroy$, novos => { this.planejamentosAssinados = novos; this.cdr.markForCheck(); });
          } else {
            this.acoesConsulta.verificarQuestionariosRespondidos(this.todasConsultas, this.questionariosRespondidos, this.destroy$, novos => { this.questionariosRespondidos = novos; this.cdr.markForCheck(); });
          }
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregando = false;
          this.cdr.markForCheck();
          this.notificacao.fire('Erro', 'Não foi possível carregar as consultas.', 'error');
        }
      });
  }

  private extrairProfissionais(): void {
    const { profissionais, especialidades } = extrairProfissionaisEEspecialidades(this.todasConsultas);
    this.profissionaisDisponiveis = profissionais;
    this.especialidadesDisponiveis = especialidades;
  }

  // ========== FILTROS ==========

  aplicarFiltros(): void {
    const filtros: FiltrosAgenda = {
      finalizadas: this.filtroFinalizadas,
      status: this.filtroStatusSelecionados,
      profissional: this.filtroProfissional,
      especialidade: this.filtroEspecialidade,
      busca: this.filtroBusca,
    };
    this.consultasFiltradas = filtrarConsultas(this.todasConsultas, filtros);
    this.gerarCalendario();
    this.cdr.markForCheck();
  }

  toggleStatus(value: string): void {
    const idx = this.filtroStatusSelecionados.indexOf(value);
    if (idx >= 0) {
      this.filtroStatusSelecionados.splice(idx, 1);
    } else {
      this.filtroStatusSelecionados.push(value);
    }
    this.aplicarFiltros();
  }

  definirTipoConsulta(finalizadas: boolean): void {
    this.filtroFinalizadas = finalizadas;
    this.filtroStatusSelecionados = [];
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.filtroFinalizadas = false;
    this.filtroBusca = '';
    this.filtroEspecialidade = '';
    this.filtroProfissional = '';
    this.filtroStatusSelecionados = [];
    this.aplicarFiltros();
  }

  // ========== GERAÇÃO DO CALENDÁRIO ==========

  gerarCalendario(): void {
    if (this.tipoVisualizacao === 'mes') {
      this.diasCalendario = gerarDiasMes(this.dataAtual, this.consultasFiltradas, new Date());
    } else if (this.tipoVisualizacao === 'semana') {
      this.diasSemana = gerarDiasSemana(this.dataAtual, this.consultasFiltradas, new Date());
    } else {
      this.horasDia = gerarHorasDia(this.dataAtual, this.consultasFiltradas);
    }
  }

  // ========== NAVEGAÇÃO ==========

  private atualizarTitulo(): void {
    this.tituloAtual = tituloDoPeriodo(this.tipoVisualizacao, this.dataAtual);
  }

  irParaHoje(): void {
    this.dataAtual = new Date();
    this.atualizarTitulo();
    this.carregarConsultas();
  }

  irParaAnterior(): void {
    this.dataAtual = deslocarPeriodo(this.tipoVisualizacao, this.dataAtual, -1);
    this.atualizarTitulo();
    this.carregarConsultas();
  }

  irParaProximo(): void {
    this.dataAtual = deslocarPeriodo(this.tipoVisualizacao, this.dataAtual, 1);
    this.atualizarTitulo();
    this.carregarConsultas();
  }

  mudarVisualizacao(tipo: TipoVisualizacao): void {
    this.tipoVisualizacao = tipo;
    this.atualizarTitulo();
    this.carregando = false;
    this.carregarConsultas();
  }

  selecionarDia(dia: { data: Date }): void {
    // Só recarrega HTTP se mudou de mês
    const novoMes = dia.data.getMonth() !== this.dataAtual.getMonth() ||
                    dia.data.getFullYear() !== this.dataAtual.getFullYear();
    this.dataSelecionada = dia.data;
    this.dataAtual = new Date(dia.data);
    this.atualizarTitulo();
    if (novoMes) {
      this.carregarConsultas();
    } else {
      this.tipoVisualizacao = 'dia';
      this.gerarCalendario();
      this.cdr.markForCheck();
    }
  }

  // ========== DRAWER / EVENTO ==========

  abrirPopover(consulta: Consultav2): void {
    this.consultaSelecionada = consulta;
    this.popoverAberto = true;
  }

  fecharPopover(): void {
    this.popoverAberto = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.consultaSelecionada = null;
      this.cdr.markForCheck();
    }, 300);
  }

  abrirEdicao(): void {
    if (!this.consultaSelecionada) return;
    this.fecharPopover();
    const ref = this.dialog.open(AgendarConsultaComponent, {
      maxWidth: '98vw',
      maxHeight: '92vh',
      panelClass: 'dialog-nova-consulta',
      disableClose: false,
      data: { consulta: this.consultaSelecionada }
    });
    ref.afterClosed().subscribe(atualizado => {
      if (atualizado) {
        this.carregando = false;
        this.carregarConsultas();
      }
    });
  }

  abrirNovaConsulta(event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(AgendarConsultaComponent, {
      maxWidth: '98vw',
      maxHeight: '92vh',
      panelClass: 'dialog-nova-consulta',
      disableClose: false,
    });
    ref.afterClosed().subscribe(() => {
      this.carregando = false;
      this.carregarConsultas();
    });
  }

  // ========== CONFIGURAÇÃO DE FLUXO DE CONSULTA ==========

  carregarConfiguracaoFluxo(): void {
    this.configuracoesConsultaService.buscarConfiguracaoAtual()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.configuracaoFluxo = config;
          this.pularParaConfirmado = config.pularParaConfirmado;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pularParaConfirmado = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleDropdownConfig(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownConfigAberto = !this.dropdownConfigAberto;
    this.cdr.markForCheck();
  }

  atualizarConfiguracaoFluxo(): void {
    const configuracao: ConfiguracoesConsulta = {
      pularParaConfirmado: this.pularParaConfirmado,
      descricao: this.pularParaConfirmado 
        ? 'Fluxo acelerado - cadastro direto como Confirmada' 
        : 'Fluxo normal - cadastro padrão'
    };

    this.configuracoesConsultaService.atualizarConfiguracaoAtual(configuracao)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.configuracaoFluxo = config;
          this.dropdownConfigAberto = false;
          this.cdr.markForCheck();
          this.notificacao.fire(
            'Sucesso', 
            this.pularParaConfirmado 
              ? 'Configuração atualizada: novas consultas serão cadastradas diretamente como Confirmada' 
              : 'Configuração atualizada: fluxo normal de cadastro restaurado', 
            'success'
          );
        },
        error: () => {
          this.notificacao.fire('Erro', 'Não foi possível atualizar a configuração.', 'error');
          this.pularParaConfirmado = !this.pularParaConfirmado;
          this.cdr.markForCheck();
        }
      });
  }

  /** Busca de uma vez os rascunhos do profissional logado para trocar "Iniciar" por "Retomar atendimento". */
  private carregarRascunhos(): void {
    if (this.UsuarioLogado?.perfil !== 'CLINICO') { return; }
    this.rascunhoApi.listarMeus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: lista => {
          this.consultasComRascunho = new Set((lista || []).map(r => r.consultaId));
          this.cdr.markForCheck();
        },
        // Sem a lista a agenda continua funcionando: só mostra "Iniciar" em todas.
        error: () => { this.consultasComRascunho = new Set<number>(); },
      });
  }

  podeVerTodosProfissionais(): boolean {
    return this.controleAcesso.isAdmin() || this.controleAcesso.isRecepcionista();
  }
}
