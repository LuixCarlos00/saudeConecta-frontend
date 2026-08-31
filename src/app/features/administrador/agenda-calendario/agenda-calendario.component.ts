import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, take, filter, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { Consultav2, StatusConsulta } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { AgendarConsultaComponent } from 'src/app/features/publico/agendar-consulta/agendar-consulta.component';
import { RelatorioService } from 'src/app/features/relatorio/relatorio.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';
import { ConfiguracoesConsultaApiService, ConfiguracoesConsulta } from 'src/app/services/api/configuracoes-consulta-api.service';

export type TipoVisualizacao = 'mes' | 'semana' | 'dia';

export interface DiaCalendario {
  data: Date;
  mesAtual: boolean;
  consultas: Consultav2[];
  hoje: boolean;
}

export interface HoraDia {
  hora: number;
  label: string;
  consultas: Consultav2[];
}

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
  filtroStatus: string = 'TODOS';
  filtroProfissional: string = '';
  filtroFinalizadas: boolean = false;
  filtroBusca: string = '';
  filtroEspecialidade: string = '';
  filtroStatusSelecionados: string[] = [];
  profissionaisDisponiveis: { id: number; nome: string }[] = [];
  especialidadesDisponiveis: string[] = [];
  planejamentosAssinados = new Set<number>();
  questionariosRespondidos = new Set<number>();

  readonly statusOpcoes = [
    { value: 'AGENDADA',   label: 'Agendada',   cor: 'status-agendada'   },
    { value: 'CONFIRMADA', label: 'Confirmada', cor: 'status-confirmada' },
    { value: 'REALIZADA',  label: 'Realizada',  cor: 'status-realizada'  },
    { value: 'CANCELADA',  label: 'Cancelada',  cor: 'status-cancelada'  },
    { value: 'PAGO',       label: 'Pago',       cor: 'status-pago'       },
  ];

  readonly STATUS_FINALIZADAS = ['REALIZADA', 'PAGO', 'CANCELADA'];
  readonly STATUS_AGENDADAS   = ['AGENDADA', 'CONFIRMADA'];

  get legendaAtual() {
    return this.filtroFinalizadas
      ? this.statusOpcoes.filter(s => ['REALIZADA', 'PAGO', 'CANCELADA'].includes(s.value))
      : this.statusOpcoes.filter(s => ['AGENDADA', 'CONFIRMADA'].includes(s.value));
  }

  // Popover / evento selecionado
  consultaSelecionada: Consultav2 | null = null;
  popoverAberto = false;
  popoverTop = 0;
  popoverLeft = 0;

  // Estado
  filtrosRecolhidos = false;
  carregando = false;
  tituloAtual = '';
  UsuarioLogado: Usuario = { id: 0, aud: '', exp: '', iss: '', sub: '', nome: '' };
  private dadosCarregados = false;

  // Configuração de fluxo de consulta
  dropdownConfigAberto = false;
  pularParaAgendado = false;
  configuracaoFluxo: ConfiguracoesConsulta | null = null;
  
  // Referência para o event listener
  private dropdownClickListener: any;

  readonly STATUS_LABELS: Record<string, string> = {
    AGENDADA: 'Agendada',
    CONFIRMADA: 'Confirmada',
    REALIZADA: 'Realizada',
    CANCELADA: 'Cancelada',
    PAGO: 'Pago',
    FALTOU: 'Faltou',
    REMARCADA: 'Remarcada',
  };

  readonly DIAS_SEMANA_NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  readonly MESES_NOMES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private consultaService: ConsultaApiService,
    private consultaState: ConsultaStateService,
    private prontuarioState: ProntuarioStateService,
    private tokenService: tokenService,
    public controleAcesso: ControleAcessoApiService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private relatorioService: RelatorioService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService,
    private prontuarioApiService: ProntuarioApiService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService,
    private router: Router,
    private configuracoesConsultaService: ConfiguracoesConsultaApiService,
  ) {}

  ngOnInit(): void {
    this.atualizarTitulo();
    this.carregarConfiguracaoFluxo();
    this.tokenService.UsuarioLogadoValue$
      .pipe(
        filter(u => !!u && !!u.id),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(usuario => {
        this.UsuarioLogado = usuario!;
        this.carregarConsultas();
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

    const dataRef = this.formatarDataParaApi(this.dataAtual);
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
            this.verificarPlanejamentosAssinados();
          } else {
            this.verificarQuestionariosRespondidos();
          }
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregando = false;
          this.cdr.markForCheck();
          Swal.fire('Erro', 'Não foi possível carregar as consultas.', 'error');
        }
      });
  }

  private extrairProfissionais(): void {
    const mapProf = new Map<number, string>();
    const setEspec = new Set<string>();
    this.todasConsultas.forEach(c => {
      mapProf.set(c.profissionalId, c.profissionalNome);
      if (c.especialidadeNome) setEspec.add(c.especialidadeNome);
    });
    this.profissionaisDisponiveis = Array.from(mapProf.entries()).map(([id, nome]) => ({ id, nome }));
    this.especialidadesDisponiveis = Array.from(setEspec).sort();
  }

  // ========== FILTROS ==========

  aplicarFiltros(): void {
    const statusPermitidos = this.filtroFinalizadas ? this.STATUS_FINALIZADAS : this.STATUS_AGENDADAS;
    this.consultasFiltradas = this.todasConsultas.filter(c => {
      const passaTipo       = statusPermitidos.includes(c.status);
      const passaStatus     = this.filtroStatusSelecionados.length === 0 ||
                              this.filtroStatusSelecionados.includes(c.status);
      const passaProfissional = !this.filtroProfissional ||
                              c.profissionalId === Number(this.filtroProfissional);
      const passaEspecialidade = !this.filtroEspecialidade ||
                              c.especialidadeNome === this.filtroEspecialidade;
      const passaBusca      = !this.filtroBusca ||
                              c.pacienteNome?.toLowerCase().includes(this.filtroBusca.toLowerCase());
      return passaTipo && passaStatus && passaProfissional && passaEspecialidade && passaBusca;
    });
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
    if (this.tipoVisualizacao === 'mes') this.gerarVisualizacaoMes();
    else if (this.tipoVisualizacao === 'semana') this.gerarVisualizacaoSemana();
    else this.gerarVisualizacaoDia();
  }

  private gerarVisualizacaoMes(): void {
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const hoje = new Date();

    const dias: DiaCalendario[] = [];

    // Preencher dias antes do primeiro dia do mês
    for (let i = primeiroDia.getDay(); i > 0; i--) {
      const data = new Date(ano, mes, 1 - i);
      dias.push({ data, mesAtual: false, consultas: this.getConsultasDia(data), hoje: false });
    }

    // Dias do mês atual
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const data = new Date(ano, mes, d);
      dias.push({
        data,
        mesAtual: true,
        consultas: this.getConsultasDia(data),
        hoje: this.isMesmaData(data, hoje)
      });
    }

    // Preencher dias após o último dia do mês para completar a grade
    const restante = 42 - dias.length;
    for (let i = 1; i <= restante; i++) {
      const data = new Date(ano, mes + 1, i);
      dias.push({ data, mesAtual: false, consultas: this.getConsultasDia(data), hoje: false });
    }

    this.diasCalendario = dias;
  }

  private gerarVisualizacaoSemana(): void {
    const inicio = this.getInicioDaSemana(this.dataAtual);
    const hoje = new Date();
    this.diasSemana = Array.from({ length: 7 }, (_, i) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);
      return {
        data,
        mesAtual: true,
        consultas: this.getConsultasDia(data),
        hoje: this.isMesmaData(data, hoje)
      };
    });
  }

  private gerarVisualizacaoDia(): void {
    const hoje = new Date();
    this.horasDia = Array.from({ length: 13 }, (_, i) => {
      const hora = 7 + i; // 07h às 19h
      return {
        hora,
        label: `${hora.toString().padStart(2, '0')}:00`,
        consultas: this.getConsultasDiaHora(this.dataAtual, hora)
      };
    });
  }

  // ========== HELPERS DE DATA ==========

  private getConsultasDia(data: Date): Consultav2[] {
    return this.consultasFiltradas.filter(c => {
      const dataConsulta = new Date(c.dataHora);
      return this.isMesmaData(dataConsulta, data);
    });
  }

  private getConsultasDiaHora(data: Date, hora: number): Consultav2[] {
    return this.consultasFiltradas.filter(c => {
      const dataConsulta = new Date(c.dataHora);
      return this.isMesmaData(dataConsulta, data) && dataConsulta.getHours() === hora;
    });
  }

  private isMesmaData(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  private getInicioDaSemana(data: Date): Date {
    const d = new Date(data);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  private getInicioMes(): string {
    const d = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth(), 1);
    return this.formatarDataParaApi(d);
  }

  private getFimMes(): string {
    const d = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 0);
    return this.formatarDataParaApi(d);
  }

  /**
   * Formata uma data local no padrão YYYY-MM-DD, sem sofrer o deslocamento
   * de fuso horário que `toISOString()` (baseado em UTC) causaria.
   *
   * @param data Data a ser formatada
   * @returns Data no formato YYYY-MM-DD
   */
  private formatarDataParaApi(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // ========== NAVEGAÇÃO ==========

  private atualizarTitulo(): void {
    if (this.tipoVisualizacao === 'mes') {
      this.tituloAtual = `${this.MESES_NOMES[this.dataAtual.getMonth()]} ${this.dataAtual.getFullYear()}`;
    } else if (this.tipoVisualizacao === 'semana') {
      const inicio = this.getInicioDaSemana(this.dataAtual);
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + 6);
      this.tituloAtual = `${inicio.getDate()}/${inicio.getMonth() + 1} – ${fim.getDate()}/${fim.getMonth() + 1}/${fim.getFullYear()}`;
    } else {
      this.tituloAtual = `${this.dataAtual.getDate()} de ${this.MESES_NOMES[this.dataAtual.getMonth()]} de ${this.dataAtual.getFullYear()}`;
    }
  }

  irParaHoje(): void {
    this.dataAtual = new Date();
    this.atualizarTitulo();
    this.carregarConsultas();
  }

  irParaAnterior(): void {
    if (this.tipoVisualizacao === 'mes') {
      this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() - 1, 1);
    } else if (this.tipoVisualizacao === 'semana') {
      this.dataAtual = new Date(this.dataAtual);
      this.dataAtual.setDate(this.dataAtual.getDate() - 7);
    } else {
      this.dataAtual = new Date(this.dataAtual);
      this.dataAtual.setDate(this.dataAtual.getDate() - 1);
    }
    this.atualizarTitulo();
    this.carregarConsultas();
  }

  irParaProximo(): void {
    if (this.tipoVisualizacao === 'mes') {
      this.dataAtual = new Date(this.dataAtual.getFullYear(), this.dataAtual.getMonth() + 1, 1);
    } else if (this.tipoVisualizacao === 'semana') {
      this.dataAtual = new Date(this.dataAtual);
      this.dataAtual.setDate(this.dataAtual.getDate() + 7);
    } else {
      this.dataAtual = new Date(this.dataAtual);
      this.dataAtual.setDate(this.dataAtual.getDate() + 1);
    }
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

  // ========== POPOVER / EVENTO ==========

  abrirPopover(consulta: Consultav2, event: MouseEvent): void {
    event.stopPropagation();
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

  // ========== AÇÕES DO DRAWER ==========

  alterarStatusDrawer(novoStatus: string): void {
    const c = this.consultaSelecionada;
    if (!c || novoStatus === c.status) return;

    const statusConfig: Record<string, any> = {
      CONFIRMADA: { title: 'Confirmar consulta?',   text: `Consulta de ${c.pacienteNome} será marcada como CONFIRMADA.`, confirmText: 'Sim, confirmar!',  confirmColor: '#06b6d4' },
      CANCELADA:  { title: 'Cancelar consulta?',    text: `Consulta de ${c.pacienteNome} será CANCELADA.`,               confirmText: 'Sim, cancelar!',   confirmColor: '#ef4444', requiresMotivo: true },
      AGENDADA:   { title: 'Voltar para Agendada?', text: `Consulta de ${c.pacienteNome} voltará para AGENDADA.`,         confirmText: 'Sim, voltar!',     confirmColor: '#f97316' },
      PAGO:       { title: 'Marcar como Pago?',     text: `Consulta de ${c.pacienteNome} será marcada como PAGO.`,        confirmText: 'Sim, marcar!',     confirmColor: '#4f46e5' },
    };

    const cfg = statusConfig[novoStatus];
    if (!cfg) return;

    const executar = (motivo?: string) => {
      this.consultaService.alterarStatusConsulta(c.id, novoStatus, motivo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire('Sucesso', `Status alterado para ${this.STATUS_LABELS[novoStatus]}.`, 'success');
            this.fecharPopover();
            this.carregarConsultas();
          },
          error: () => Swal.fire('Erro', 'Não foi possível alterar o status.', 'error'),
        });
    };

    if (cfg.requiresMotivo) {
      Swal.fire({
        title: cfg.title, text: cfg.text, icon: 'question',
        input: 'textarea', inputLabel: 'Motivo do cancelamento',
        inputPlaceholder: 'Informe o motivo...',
        inputValidator: (v) => (!v || v.trim().length < 3) ? 'Informe o motivo (mínimo 3 caracteres).' : null,
        showCancelButton: true, confirmButtonColor: cfg.confirmColor,
        cancelButtonColor: '#6b7280', confirmButtonText: cfg.confirmText, cancelButtonText: 'Cancelar',
      }).then(r => { if (r.isConfirmed && r.value) executar(r.value); });
    } else {
      Swal.fire({
        title: cfg.title, text: cfg.text, icon: 'question',
        showCancelButton: true, confirmButtonColor: cfg.confirmColor,
        cancelButtonColor: '#6b7280', confirmButtonText: cfg.confirmText, cancelButtonText: 'Cancelar',
      }).then(r => { if (r.isConfirmed) executar(); });
    }
  }

  podeEditar(consulta: Consultav2): boolean {
    return consulta?.status === 'AGENDADA';
  }

  // ========== CONFIGURAÇÃO DE FLUXO DE CONSULTA ==========

  carregarConfiguracaoFluxo(): void {
    this.configuracoesConsultaService.buscarConfiguracaoAtual()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.configuracaoFluxo = config;
          this.pularParaAgendado = config.pularParaAgendado;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pularParaAgendado = false;
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
      pularParaAgendado: this.pularParaAgendado,
      descricao: this.pularParaAgendado 
        ? 'Fluxo acelerado - cadastro direto como Agendado' 
        : 'Fluxo normal - cadastro padrão'
    };

    this.configuracoesConsultaService.atualizarConfiguracaoAtual(configuracao)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.configuracaoFluxo = config;
          this.dropdownConfigAberto = false;
          this.cdr.markForCheck();
          Swal.fire(
            'Sucesso', 
            this.pularParaAgendado 
              ? 'Configuração atualizada: novas consultas serão cadastradas diretamente como Agendado' 
              : 'Configuração atualizada: fluxo normal de cadastro restaurado', 
            'success'
          );
        },
        error: () => {
          Swal.fire('Erro', 'Não foi possível atualizar a configuração.', 'error');
          this.pularParaAgendado = !this.pularParaAgendado;
          this.cdr.markForCheck();
        }
      });
  }

  deletarConsultaDrawer(): void {
    const c = this.consultaSelecionada;
    if (!c) return;
    Swal.fire({
      title: 'Confirmar exclusão',
      text: `Deseja excluir a consulta de ${c.pacienteNome}? O questionário de saúde será excluído.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir', cancelButtonText: 'Cancelar',
    }).then(r => {
      if (!r.isConfirmed) return;
      this.consultaService.deletarConsulta(c.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { Swal.fire('Deletado', 'Consulta deletada com sucesso.', 'success'); this.fecharPopover(); this.carregarConsultas(); },
          error: (err: any) => {
            if (err?.status === 409) Swal.fire('Exclusão bloqueada', 'Esta consulta possui prontuário clínico e não pode ser excluída. Os dados clínicos devem ser preservados.', 'info');
            else Swal.fire('Erro', 'Erro ao deletar consulta.', 'error');
          },
        });
    });
  }

  abrirImpressaoDrawer(): void {
    if (!this.consultaSelecionada) return;
    const consulta = this.consultaSelecionada;
    this.fecharPopover();
    setTimeout(() => {
      this.relatorioService.abrirRelatorioAdmin(consulta);
    }, 100);
  }

  iniciarConsultaDrawer(): void {
    if (!this.consultaSelecionada) return;

    const element = this.consultaSelecionada;
    const dataFormatada = element.dataHora
      ? new Date(element.dataHora).toLocaleDateString('pt-BR')
      : 'Não informada';
    const horarioFormatado = element.dataHora
      ? new Date(element.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Não informado';

    // Fechar o drawer antes de abrir o SweetAlert para evitar conflito de z-index
    this.fecharPopover();

    setTimeout(() => {
      Swal.fire({
        title: 'Iniciar Atendimento',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; color: #666;">
              <i class="fa-solid fa-user" style="margin-right: 8px; color: #5ccf6c;"></i>
              <strong>Paciente:</strong> ${element.pacienteNome || 'Não informado'}
            </p>
            <p style="margin-bottom: 15px; color: #666;">
              <i class="fa-solid fa-calendar" style="margin-right: 8px; color: #5ccf6c;"></i>
              <strong>Data:</strong> ${dataFormatada}
            </p>
            <p style="margin-bottom: 15px; color: #666;">
              <i class="fa-solid fa-clock" style="margin-right: 8px; color: #5ccf6c;"></i>
              <strong>Horário:</strong> ${horarioFormatado}
            </p>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #888;">
            Deseja iniciar o atendimento deste paciente?
          </p>
        `,
        showCancelButton: true,
        confirmButtonColor: '#5ccf6c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fa-solid fa-stethoscope"></i> Iniciar Atendimento',
        cancelButtonText: '<i class="fa-solid fa-times"></i> Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Iniciando consulta...',
            html: 'Aguarde enquanto preparamos o prontuário.',
            allowOutsideClick: false,
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: () => { Swal.showLoading(); },
          }).then(() => {
            this.prontuarioState.changeConsulta(element);
            if (this.UsuarioLogado.tipoProfissional === 'MEDICO') {
              this.router.navigate(['startconsulta']);
            } else if (this.UsuarioLogado.tipoProfissional === 'DENTISTA') {
              this.router.navigate(['startconsulta-dentista']);
            }
          });
        }
      });
    }, 300);
  }

  gerarWhatsAppDrawer(): string {
    const c = this.consultaSelecionada;
    if (!c?.pacienteTelefone) return '';
    const telefone = this.formatarTelefoneWhatsApp(c.pacienteTelefone);
    const mensagem = this.gerarMensagemWhatsApp(c);
    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  }

  private gerarMensagemWhatsApp(consulta: Consultav2): string {
    const dataHora = new Date(consulta.dataHora);
    const data = dataHora.toLocaleDateString('pt-BR');
    const horario = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const paciente = consulta.pacienteNome || 'Paciente';
    const medico = consulta.profissionalNome || 'Profissional';
    return `Olá ${paciente}, tudo bem?\n\nGostaríamos de confirmar sua consulta com ${medico} no dia ${data} às ${horario}.\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nAtenciosamente,\nEquipe da Clínica.`;
  }

  private formatarTelefoneWhatsApp(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.startsWith('55') ? numeros : '55' + numeros;
  }

  // ========== QUESTIONÁRIO E PLANEJAMENTO ==========

  private buscarProntuarioMaisRecente(consulta: Consultav2): Observable<any> {
    const tipo = this.relatorioService.detectarTipoProfissional(consulta);
    if (tipo === 'DENTISTA') {
      return this.prontuarioDentistaApiService.buscarProntuarioDentistaById(consulta.id);
    }
    return this.prontuarioApiService.buscarMaisRecentePorConsulta(consulta.id);
  }

  private extrairCodigoProntuario(prontuario: any): number | null {
    return prontuario?.codigo ?? prontuario?.codigoProntuario ?? null;
  }

  private verificarPlanejamentosAssinados(): void {
    const finalizadas = this.todasConsultas.filter(c => c.status === 'REALIZADA');
    for (const consulta of finalizadas) {
      if (!consulta?.id || this.planejamentosAssinados.has(consulta.id)) continue;
      this.buscarProntuarioMaisRecente(consulta)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (prontuario: any) => {
            const plans = prontuario?.planejamentosTerapeuticos || prontuario?.planejamentos || [];
            if (plans.length > 0 && plans.every((p: any) => p.statusAssinatura === 'ASSINADO')) {
              this.planejamentosAssinados.add(consulta.id);
              this.cdr.markForCheck();
            }
          }
        });
    }
  }

  private verificarQuestionariosRespondidos(): void {
    const confirmadas = this.todasConsultas.filter(c => c.status === 'CONFIRMADA');
    for (const consulta of confirmadas) {
      if (!consulta?.id || this.questionariosRespondidos.has(consulta.id)) continue;
      this.prontuarioDentistaApiService.buscarQuestionarioSaude(consulta.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: any) => {
            if (resp?.respondido) {
              this.questionariosRespondidos.add(consulta.id);
              this.cdr.markForCheck();
            }
          }
        });
    }
  }

  gerarLinkQuestionarioDrawer(): void {
    const element = this.consultaSelecionada;
    if (!element?.id) return;
    this.prontuarioDentistaApiService.buscarQuestionarioSaude(element.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp?.respondido) {
            this.questionariosRespondidos.add(element.id);
            this.cdr.markForCheck();
            Swal.fire('Aviso', 'O questionário de saúde já foi respondido e assinado pelo paciente.', 'info');
            return;
          }
          this.executarGeracaoLinkQuestionario(element);
        },
        error: () => this.executarGeracaoLinkQuestionario(element)
      });
  }

  private executarGeracaoLinkQuestionario(element: Consultav2): void {
    this.prontuarioDentistaApiService.gerarLinkQuestionario(element.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const baseUrl = window.location.origin;
          const link = `${baseUrl}/#/questionario-saude/${resp.token}`;
          navigator.clipboard.writeText(link).then(() => {
            Swal.fire({
              icon: 'success', title: 'Link Gerado!',
              html: `<p style="font-size:0.9rem;">Link copiado para a área de transferência.</p>
                     <input type="text" value="${link}" readonly
                       style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
              confirmButtonText: 'OK'
            });
          }).catch(() => {
            Swal.fire({
              icon: 'info', title: 'Link Gerado',
              html: `<p style="font-size:0.9rem;">Copie o link abaixo e envie ao paciente:</p>
                     <input type="text" value="${link}" readonly
                       style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
              confirmButtonText: 'OK'
            });
          });
        },
        error: () => Swal.fire('Erro', 'Não foi possível gerar o link do questionário.', 'error')
      });
  }

  gerarLinkPlanejamentoDrawer(): void {
    const element = this.consultaSelecionada;
    if (!element?.id) return;
    const tipoProfissional = this.relatorioService.detectarTipoProfissional(element);
    this.buscarProntuarioMaisRecente(element)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario: any) => {
          const codigoProntuario = this.extrairCodigoProntuario(prontuario);
          if (!codigoProntuario) {
            Swal.fire('Aviso', 'Nenhum prontuário encontrado para esta consulta.', 'warning');
            return;
          }
          const plans = prontuario?.planejamentosTerapeuticos || prontuario?.planejamentos || [];
          if (plans.length > 0 && plans.every((p: any) => p.statusAssinatura === 'ASSINADO')) {
            this.planejamentosAssinados.add(element.id);
            this.cdr.markForCheck();
            Swal.fire('Aviso', 'Todos os itens do planejamento já foram assinados pelo paciente.', 'info');
            return;
          }
          this.planejamentoApi.gerarLinkAssinatura(codigoProntuario, tipoProfissional)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (resp) => {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/#/assinatura-planejamento/${resp.token}`;
                navigator.clipboard.writeText(link).catch(() => {});
                Swal.fire({
                  icon: 'success', title: 'Link Gerado!',
                  html: `<p style="font-size:0.9rem;">Copie o link abaixo e envie ao paciente:</p>
                         <input type="text" value="${link}" readonly
                           style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
                  confirmButtonText: 'OK'
                });
              },
              error: () => Swal.fire('Erro', 'Não foi possível gerar o link do planejamento.', 'error')
            });
        },
        error: () => Swal.fire('Erro', 'Não foi possível buscar o prontuário desta consulta.', 'error')
      });
  }

  // ========== HELPERS DE STATUS ==========

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      AGENDADA: 'status-agendada',
      CONFIRMADA: 'status-confirmada',
      REALIZADA: 'status-realizada',
      CANCELADA: 'status-cancelada',
      PAGO: 'status-pago',
      FALTOU: 'status-faltou',
      REMARCADA: 'status-remarcada',
    };
    return map[status] || '';
  }

  getHorario(dataHora: string): string {
    if (!dataHora) return '';
    const d = new Date(dataHora);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  isStatusDone(etapa: string, statusAtual: string): boolean {
    const ordem = ['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'PAGO'];
    return ordem.indexOf(statusAtual) > ordem.indexOf(etapa);
  }

  podeVerTodosProfissionais(): boolean {
    return this.controleAcesso.isAdmin() || this.controleAcesso.isRecepcionista();
  }

  /**
   * Define se o botao de edicao da consulta deve ser exibido no drawer.
   * Consultas confirmadas nao podem ser editadas por clinico ou gestor.
   *
   * @param status status atual da consulta
   * @returns true quando a edicao e permitida para o perfil logado
   */
  podeEditarConsulta(status: string): boolean {
    const perfilRestrito = this.controleAcesso.isAdmin() || this.controleAcesso.isProfissional();

    if (status === 'CONFIRMADA' && perfilRestrito) {
      return false;
    }

    return (status === 'AGENDADA' || status === 'CONFIRMADA') && this.controleAcesso.isAdmin();
  }
}
