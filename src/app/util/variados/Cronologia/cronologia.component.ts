import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { EspecialidadeApiService, EspecialidadeResponse } from 'src/app/services/api/especialidade-api.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { Profissional } from '../interfaces/medico/Profissional';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';

interface FiltrosPesquisa {
  medico: Profissional | null;
  especialidade: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  statusConsulta: string[];
  statusPagamento: string | null;
}

interface TipoPesquisa {
  nome: string;
  metodo: () => void;
  prioridade: number;
}

@Component({
  selector: 'app-cronologia',
  templateUrl: './cronologia.component.html',
  styleUrls: ['./cronologia.component.css'],
})
export class CronologiaComponent implements OnInit {
  // Formulários
  IntervaloDeDatas!: FormGroup;
  OpcoesCategorias!: FormGroup;
  OpcoesMedicos!: FormGroup;
  OpcoesStatusConsulta!: FormGroup;
  OpcoesStatusPagamento!: FormGroup;

  // Dados
  especialidades: EspecialidadeResponse[] = [];
  ListaMedicos: Profissional[] = [];
  tipoPesquisaConcluidas = false;
  carregando = false;
  carregandoEspecialidades = false;
  filtrosAtuais: FiltrosPesquisa | null = null;

  // Status para busca
  private readonly STATUS_FINALIZADAS = ['REALIZADA', 'CANCELADA', 'PAGO'];
  private readonly STATUS_AGENDADAS = ['AGENDADA', 'CONFIRMADA'];

  // Opções de status disponíveis
  statusConsultaOptions = [
    { value: 'AGENDADA', label: 'Agendada', grupo: 'agendadas' },
    { value: 'CONFIRMADA', label: 'Confirmada', grupo: 'agendadas' },
    { value: 'REALIZADA', label: 'Realizada', grupo: 'finalizadas' },
    { value: 'CANCELADA', label: 'Cancelada', grupo: 'finalizadas' },
    { value: 'PAGO', label: 'Pago', grupo: 'finalizadas' }
  ];

  statusPagamentoOptions = [
    { value: 'PAGO', label: 'Pago' },
    { value: 'PENDENTE', label: 'Pendente' }
  ];

  get statusDisponiveis() {
    return this.statusConsultaOptions.filter(s => 
      this.tipoPesquisaConcluidas ? s.grupo === 'finalizadas' : s.grupo === 'agendadas'
    );
  }

  constructor(
    public dialogRef: MatDialogRef<CronologiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { Pesquisa: boolean },
    private profissionalApiService: ProfissionalApiService,
    private especialidadeService: EspecialidadeApiService,
    private formBuilder: FormBuilder,
    private consultaApiService: ConsultaApiService,
    private consultaState: ConsultaStateService,
    public controleAcesso: ControleAcessoApiService
  ) { }

  get podeVerFiltrosAvancados(): boolean {
    return this.controleAcesso.isAdmin() ||
      this.controleAcesso.isSuperAdmin() ||
      this.controleAcesso.isRecepcionista();
  }

  ngOnInit(): void {
    this.tipoPesquisaConcluidas = this.data?.Pesquisa || false;
    this.inicializarFormularios();
    this.carregarMedicos();
    this.carregarEspecialidades();
  }

  // ==================== INICIALIZAÇÃO ====================
  private inicializarFormularios(): void {
    this.IntervaloDeDatas = this.formBuilder.group({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });

    this.OpcoesCategorias = this.formBuilder.group({
      Especialidade: new FormControl(null),
    });

    // CORREÇÃO: Usar o mesmo nome que está no HTML
    this.OpcoesMedicos = this.formBuilder.group({
      NomeMedico: new FormControl<Profissional | null>(null), // Nome correto e tipado
    });

    this.OpcoesStatusConsulta = this.formBuilder.group({
      statusSelecionados: new FormControl<string[]>([])
    });

    this.OpcoesStatusPagamento = this.formBuilder.group({
      statusPagamento: new FormControl<string | null>(null)
    });
  }

  private carregarMedicos(): void {
    this.carregando = true;

    this.profissionalApiService.buscarTodosClinicosByOrg().subscribe({
      next: (dados: Profissional[]) => {
        if (dados && dados.length > 0) {
          this.ListaMedicos = dados.sort((a, b) =>
            a.nome.localeCompare(b.nome)
          );
        }
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar médicos:', error);
        Swal.fire('Erro', 'Não foi possível carregar a lista de médicos', 'error');
        this.carregando = false;
      }
    });
  }

  private carregarEspecialidades(): void {
    this.carregandoEspecialidades = true;

    this.especialidadeService.carregarEspecialidades().subscribe({
      next: (dados: EspecialidadeResponse[]) => {
        if (dados && dados.length > 0) {
          this.especialidades = dados.sort((a, b) =>
            a.nome.localeCompare(b.nome)
          );
        }
        this.carregandoEspecialidades = false;
      },
      error: (error) => {
        console.error('Erro ao carregar especialidades:', error);
        Swal.fire('Erro', 'Não foi possível carregar a lista de especialidades', 'error');
        this.carregandoEspecialidades = false;
      }
    });
  }

  // ==================== AÇÕES DO USUÁRIO ====================
  toggleStatusConsulta(status: string, checked: boolean): void {
    const statusSelecionados = this.OpcoesStatusConsulta.get('statusSelecionados')?.value || [];
    
    if (checked) {
      if (!statusSelecionados.includes(status)) {
        statusSelecionados.push(status);
      }
    } else {
      const index = statusSelecionados.indexOf(status);
      if (index > -1) {
        statusSelecionados.splice(index, 1);
      }
    }
    
    this.OpcoesStatusConsulta.patchValue({ statusSelecionados });
  }

  // Método auxiliar para checkbox nativo
  onCheckboxChange(event: Event, status: string): void {
    const target = event.target as HTMLInputElement;
    this.toggleStatusConsulta(status, target.checked);
  }

  limparFiltros(): void {
    this.IntervaloDeDatas.reset();
    this.OpcoesCategorias.reset();
    this.OpcoesMedicos.reset();
    this.OpcoesStatusConsulta.patchValue({ statusSelecionados: [] });
    this.OpcoesStatusPagamento.reset();
  }

  VerificaTipoDePesquisa(): void {
    const filtros = this.obterFiltros();
console.log(filtros);
    if (!this.validarFiltros(filtros)) {
      Swal.fire('Atenção', 'Selecione pelo menos um filtro para pesquisar.', 'warning');
      return;
    }

    this.executarBuscaDinamica(filtros);
  }

  // ==================== OBTENÇÃO E VALIDAÇÃO DE FILTROS ====================
  private obterFiltros(): FiltrosPesquisa {
    const medicoId = this.OpcoesMedicos.get('NomeMedico')?.value;
    const medicoSelecionado = medicoId
    ? this.ListaMedicos.find(m => m.id == medicoId) || null
    : null;

    const statusSelecionados = this.OpcoesStatusConsulta.get('statusSelecionados')?.value || [];
    const statusPagamento = this.OpcoesStatusPagamento.get('statusPagamento')?.value;

    return {
      medico: medicoSelecionado || null,
      especialidade: this.OpcoesCategorias.get('Especialidade')?.value || null,
      dataInicio: this.IntervaloDeDatas.get('start')?.value || null,
      dataFim: this.IntervaloDeDatas.get('end')?.value || null,
      statusConsulta: statusSelecionados,
      statusPagamento: statusPagamento
    };
  }

  private validarFiltros(filtros: FiltrosPesquisa): boolean {
    return !!(filtros.medico || filtros.especialidade ||
      (filtros.dataInicio && filtros.dataFim) ||
      filtros.statusConsulta.length > 0 ||
      filtros.statusPagamento);
  }

  private validarDatas(dataInicio: Date | null, dataFim: Date | null): boolean {
    if (!dataInicio || !dataFim) {
      return false;
    }

    if (dataInicio > dataFim) {
      Swal.fire('Atenção', 'A data inicial não pode ser posterior à data final', 'warning');
      return false;
    }

    return true;
  }

  // ==================== EXECUÇÃO DE BUSCA DINÂMICA ====================
  /**
   * Determina quais status usar na busca baseado nos filtros do usuário
   */
  private obterStatusParaBusca(filtros: FiltrosPesquisa): string[] {
    // Se usuário selecionou status específicos, usa eles
    if (filtros.statusConsulta.length > 0) {
      return filtros.statusConsulta;
    }
    
    // Se tem apenas filtro de pagamento, busca todos os status finalizados
    if (filtros.statusPagamento && filtros.statusConsulta.length === 0) {
      return this.STATUS_FINALIZADAS;
    }
    
    // Caso contrário, usa os status padrão baseado no tipo de pesquisa
    return this.tipoPesquisaConcluidas ? this.STATUS_FINALIZADAS : this.STATUS_AGENDADAS;
  }

  /**
   * Executa busca dinâmica com todos os filtros opcionais
   * Usa o endpoint único /buscar do backend
   */
  private executarBuscaDinamica(filtros: FiltrosPesquisa): void {
    this.carregando = true;
    this.filtrosAtuais = filtros;

    // Preparar parâmetros para o endpoint dinâmico
    const profissionalId = filtros.medico?.id;
    const especialidade = filtros.especialidade || undefined;
    const dataInicial = filtros.dataInicio ? this.formatarData(filtros.dataInicio) : undefined;
    const dataFinal = filtros.dataFim ? this.formatarData(filtros.dataFim) : undefined;
    
    // Determinar status a buscar
    const statusParaBuscar = this.obterStatusParaBusca(filtros);

    // Chamar endpoint dinâmico
    this.consultaApiService.buscarComFiltrosDinamicos(
      profissionalId,
      especialidade,
      dataInicial,
      dataFinal,
      statusParaBuscar
    ).subscribe({
      next: (dados: any) => {
        this.carregando = false;

        // Aplicar filtro de status de pagamento se especificado
        let dadosFiltrados = dados;
        if (filtros.statusPagamento) {
          dadosFiltrados = this.filtrarPorStatusPagamento(dados, filtros.statusPagamento);
        }

        if (dadosFiltrados && dadosFiltrados.length > 0) {
          this.consultaState.setDadosCronologia(dadosFiltrados);
          this.dialogRef.close();
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Nenhum resultado',
            text: 'Nenhuma consulta encontrada com os filtros selecionados.',
            confirmButtonColor: '#0066CC'
          });
        }
      },
      error: (error: any) => {
        this.carregando = false;
        console.error('Erro na busca:', error);

        Swal.fire({
          icon: 'error',
          title: 'Erro na pesquisa',
          text: 'Não foi possível realizar a pesquisa. Tente novamente.',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }


  // ==================== UTILITÁRIOS ====================
  /**
   * Filtra consultas por status de pagamento
   */
  private filtrarPorStatusPagamento(consultas: any[], statusPagamento: string): any[] {
    return consultas.filter(consulta => {
      if (statusPagamento === 'PAGO') {
        return consulta.status === 'PAGO';
      } else if (statusPagamento === 'PENDENTE') {
        return consulta.status === 'REALIZADA' || consulta.status === 'CANCELADA';
      }
      return true;
    });
  }

  private formatarData(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  fecharDialog(): void {
    this.dialogRef.close();
  }
}
