import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { EspecialidadeService, EspecialidadeResponse } from 'src/app/services/api/especialidade.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { Profissional } from '../interfaces/medico/Profissional';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';

interface FiltrosPesquisa {
  medico: Profissional | null;
  especialidade: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
}

interface TipoPesquisa {
  nome: string;
  metodo: () => void;
  prioridade: number;
}

@Component({
  selector: 'app-cronologia',
  templateUrl: 'cronologia.component.html',
  styleUrls: ['./cronologia.component.css'],
})
export class CalendarDialogComponent implements OnInit {
  // Formulários
  IntervaloDeDatas!: FormGroup;
  OpcoesCategorias!: FormGroup;
  OpcoesMedicos!: FormGroup;

  // Dados
  especialidades: EspecialidadeResponse[] = [];
  ListaMedicos: Profissional[] = [];
  tipoPesquisaConcluidas = false;
  carregando = false;
  carregandoEspecialidades = false;

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { Pesquisa: boolean },
    private profissionalApiService: ProfissionalApiService,
    private especialidadeService: EspecialidadeService,
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
  limparFiltros(): void {
    this.IntervaloDeDatas.reset();
    this.OpcoesCategorias.reset();
    this.OpcoesMedicos.reset();
  }

  VerificaTipoDePesquisa(): void {
    const filtros = this.obterFiltros();

    if (!this.validarFiltros(filtros)) {
      Swal.fire('Atenção', 'Selecione pelo menos um filtro para pesquisar.', 'warning');
      return;
    }

    const tipoPesquisa = this.determinarTipoPesquisa(filtros);
    this.executarPesquisa(tipoPesquisa, filtros);
  }

  // ==================== OBTENÇÃO E VALIDAÇÃO DE FILTROS ====================
  private obterFiltros(): FiltrosPesquisa {
    const medicoSelecionado = this.OpcoesMedicos.get('NomeMedico')?.value;

    return {
      medico: medicoSelecionado || null, // Agora pega o objeto completo do Profissional
      especialidade: this.OpcoesCategorias.get('Especialidade')?.value || null,
      dataInicio: this.IntervaloDeDatas.get('start')?.value || null,
      dataFim: this.IntervaloDeDatas.get('end')?.value || null,
    };
  }

  private validarFiltros(filtros: FiltrosPesquisa): boolean {
    return !!(filtros.medico || filtros.especialidade ||
      (filtros.dataInicio && filtros.dataFim));
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

  // ==================== DETERMINAÇÃO DO TIPO DE PESQUISA ====================
  private determinarTipoPesquisa(filtros: FiltrosPesquisa): string {
    const { medico, especialidade, dataInicio, dataFim } = filtros;

    const temMedico = !!medico;
    const temEspecialidade = !!especialidade;
    const temDatas = !!(dataInicio && dataFim);
    // Ordem de prioridade (do mais específico ao menos específico)
    if (temMedico && temEspecialidade && temDatas) {
      return 'MEDICO_ESPECIALIDADE_DATAS';
    }
    if (temMedico && temDatas) {
      return 'MEDICO_DATAS';
    }
    if (temEspecialidade && temDatas) {
      return 'ESPECIALIDADE_DATAS';
    }
    if (temMedico && temEspecialidade) {
      return 'MEDICO_ESPECIALIDADE';
    }
    if (temMedico) {
      return 'MEDICO';
    }
    if (temEspecialidade) {
      return 'ESPECIALIDADE';
    }
    if (temDatas) {
      return 'DATAS';
    }

    return 'NENHUM';
  }

  // ==================== EXECUÇÃO DE PESQUISAS ====================
  private executarPesquisa(tipo: string, filtros: FiltrosPesquisa): void {
    const { medico, especialidade, dataInicio, dataFim } = filtros;

    const metodos: Record<string, () => void> = {
      'MEDICO_ESPECIALIDADE_DATAS': () =>
        this.pesquisarMedicoEspecialidadeEmIntervaloDeDatas(
          medico!.id,
          especialidade!,
          dataInicio!,
          dataFim!
        ),
      'MEDICO_DATAS': () =>
        this.pesquisarClinicasEmIntervaloDeDatas(medico!.id, dataInicio!, dataFim!),
      'ESPECIALIDADE_DATAS': () =>
        this.pesquisarEspecialidadeEmIntervaloDeDatas(especialidade!, dataInicio!, dataFim!),
      'MEDICO_ESPECIALIDADE': () =>
        this.pesquisarPorMedicoEEspecialidade(medico!.id, especialidade!),
      'MEDICO': () =>
        this.pesquisarPorProfissional(medico!.id),
      'ESPECIALIDADE': () =>
        this.pesquisarPorEspecialidade(especialidade!),
      'DATAS': () =>
        this.pesquisarPorIntervaloDeDatas(dataInicio!, dataFim!),
    };

    const metodo = metodos[tipo];
    if (metodo) {
      this.carregando = true;
      metodo();
    }
  }

  // ==================== MÉTODOS DE PESQUISA ====================
  private pesquisarPorIntervaloDeDatas(dataInicio: Date, dataFim: Date): void {
    if (!this.validarDatas(dataInicio, dataFim)) {
      this.carregando = false;
      return;
    }

    const inicio = this.formatarData(dataInicio);
    const fim = this.formatarData(dataFim);

    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.buscarPorIntervaloDeDatas(inicio, fim, 'REALIZADA')
      : this.consultaApiService.buscarPorIntervaloDeDatas(inicio, fim, 'AGENDADA');
    this.executarRequisicao(metodo, 'pesquisa por intervalo de datas');
  }

  private pesquisarEspecialidadeEmIntervaloDeDatas(
    especialidade: string,
    dataInicio: Date,
    dataFim: Date
  ): void {
    if (!this.validarDatas(dataInicio, dataFim)) {
      this.carregando = false;
      return;
    }

    const inicio = this.formatarData(dataInicio);
    const fim = this.formatarData(dataFim);

    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.pesquisarEspecialidadeEmIntervaloDeDatas(
        inicio, fim, especialidade, 'REALIZADA'
      )
      : this.consultaApiService.pesquisarEspecialidadeEmIntervaloDeDatas(
        inicio, fim, especialidade, 'AGENDADA'
      );

    this.executarRequisicao(metodo, 'pesquisa por especialidade e datas');
  }

  private pesquisarPorProfissional(medicoId: number): void {
    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.pesquisarPorProfissional(medicoId)
      : this.consultaApiService.pesquisarPorProfissional(medicoId);

    this.executarRequisicao(metodo, 'pesquisa por médico');
  }

  private pesquisarClinicasEmIntervaloDeDatas(
    medicoId: number,
    dataInicio: Date,
    dataFim: Date
  ): void {
    if (!this.validarDatas(dataInicio, dataFim)) {
      this.carregando = false;
      return;
    }

    const inicio = this.formatarData(dataInicio);
    const fim = this.formatarData(dataFim);

    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.pesquisarClinicasEmIntervaloDeDatas(
        medicoId, inicio, fim, 'REALIZADA'
      )
      : this.consultaApiService.pesquisarClinicasEmIntervaloDeDatas(
        medicoId, inicio, fim, 'AGENDADA'
      );

    this.executarRequisicao(metodo, 'pesquisa por médico e datas');
  }

  private pesquisarPorEspecialidade(especialidade: string): void {
    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.pesquisarPorEspecialidade(especialidade, 'REALIZADA')
      : this.consultaApiService.pesquisarPorEspecialidade(especialidade, 'AGENDADA');

    this.executarRequisicao(metodo, 'pesquisa por especialidade');
  }

  private pesquisarPorMedicoEEspecialidade(medicoId: number, especialidade: string): void {
    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.pesquisarPorMedicoEEspecialidade(
        medicoId, especialidade, 'REALIZADA'
      )
      : this.consultaApiService.pesquisarPorMedicoEEspecialidade(
        medicoId, especialidade, 'AGENDADA'
      );

    this.executarRequisicao(metodo, 'pesquisa por médico e especialidade');
  }

  private pesquisarMedicoEspecialidadeEmIntervaloDeDatas(
    medicoId: number,
    especialidade: string,
    dataInicio: Date,
    dataFim: Date
  ): void {
    if (!this.validarDatas(dataInicio, dataFim)) {
      this.carregando = false;
      return;
    }

    const inicio = this.formatarData(dataInicio);
    const fim = this.formatarData(dataFim);

    const metodo = this.tipoPesquisaConcluidas
      ? this.consultaApiService.pesquisarMedicoEspecialidadeEmIntervaloDeDatas(
        medicoId, especialidade, inicio, fim, 'REALIZADA'
      )
      : this.consultaApiService.pesquisarMedicoEspecialidadeEmIntervaloDeDatas(
        medicoId, especialidade, inicio, fim, 'AGENDADA'
      );

    this.executarRequisicao(metodo, 'pesquisa completa');
  }

  // ==================== EXECUÇÃO E TRATAMENTO DE REQUISIÇÕES ====================
  private executarRequisicao(observable: any, nomePesquisa: string): void {
    observable.subscribe({
      next: (dados: any) => {
        this.carregando = false;

        if (dados && Object.keys(dados).length > 0) {
          this.consultaState.setDadosCronologia(dados);
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
        console.error(`Erro na ${nomePesquisa}:`, error);

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
  private formatarData(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  fecharDialog(): void {
    this.dialogRef.close();
  }
}
