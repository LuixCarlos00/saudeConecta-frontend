import { ProfissionalApiService } from 'src/app/core/data-access/profissional-api.service';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';
import { ConsultaApiService, HorarioOcupado } from 'src/app/core/data-access/consulta-api.service';
import { PacienteApiService } from 'src/app/core/data-access/paciente-api.service';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';
import { HoradaConsulta } from 'src/app/util/variados/options/options';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { FORMAS_PAGAMENTO, rotuloFormaPagamento } from 'src/app/shared/constants/forma-pagamento.constant';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';
import { escaparHtml } from 'src/app/shared/utils/escapar-html';
import { formatarDataLocal, formatarHoraLocal } from 'src/app/shared/utils/data-local';

interface ConsultaEdit {
  id: number;
  profissionalId: number;
  profissionalNome: string;
  profissionalConselho: string;
  pacienteId: number;
  pacienteNome: string;
  especialidadeId: number;
  especialidadeNome: string;
  dataHora: string;
  dataHoraFim: string;
  duracaoMinutos: number;
  status: string;
  observacoes: string | null;
  formaPagamentoId: number;
  formaPagamentoNome: string;
  valor: number;
  createdAt: string;
}


const DURACAO_PADRAO_MINUTOS = 30;

@Component({
  selector: 'app-Editar-Consultas',
  templateUrl: './Editar-Consultas.component.html',
  styleUrls: ['./Editar-Consultas.component.css'],
})
export class EditarConsultasComponent implements OnInit {
  readonly formasPagamento = FORMAS_PAGAMENTO;

  FormGroupConsulta!: FormGroup;
  Hora: any[] = [];
  dadosPacientePassandoTabela: Paciente[] = [];
  dadosMedicoPassandoTabela: Profissional[] = [];
  showResultadoPaciente = false;
  showResultadoMedico = false;

  consulta: ConsultaEdit;
  pacienteSelecionado: Paciente | null = null;
  medicoSelecionado: Profissional | null = null;
  carregandoHorarios = false;

  constructor(
    private notificacao: NotificacaoService,
    public dialogRef: MatDialogRef<EditarConsultasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { consulta: ConsultaEdit },
    private pacienteApi: PacienteApiService,
    private form: FormBuilder,
    private consultaApi: ConsultaApiService,
    private profissionalApiService: ProfissionalApiService
  ) {
    this.consulta = { ...this.data.consulta };
  }

  async ngOnInit() {

    this.inicializarFormulario();
    await this.carregarDadosIniciais();
    this.preencherFormulario();
    await this.inicializarHorarios();
  }

  private inicializarFormulario(): void {
    this.FormGroupConsulta = this.form.group({
      data: ['', Validators.required],
      horario: ['', Validators.required],
      observacao: [''],
      formaPagamento: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(0)]], // NOVO CAMPO
      PesquisaPaciente: [''],
      FiltroPesquisaPaciente: [5],
      PesquisaMedico: [''],
      FiltroPesquisaMedico: [5],
    });
  }

  private async carregarDadosIniciais(): Promise<void> {
    try {
      // Carregar dados do paciente
      const paciente = await this.pacienteApi.buscarrPacientebyOrg(this.consulta.pacienteId).toPromise();
      if (paciente) {
        this.pacienteSelecionado = paciente;
      }

      // Carregar dados do médico
      const medico = await this.profissionalApiService.buscarClinicoIdByOrg(this.consulta.profissionalId).toPromise();
      if (medico) {
        this.medicoSelecionado = medico;
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  }

  private preencherFormulario(): void {
    const dataHora = new Date(this.consulta.dataHora);
    const dataFormatada = formatarDataLocal(dataHora);
    const horarioFormatado = formatarHoraLocal(dataHora);

    this.FormGroupConsulta.patchValue({
      data: dataFormatada,
      horario: horarioFormatado,
      observacao: this.consulta.observacoes || '',
      formaPagamento: this.consulta.formaPagamentoId,
      valor: this.consulta.valor || 0, // PREENCHER VALOR
    });
  }

  private formatarDataExibicao(dataInput: string): string {
    const [ano, mes, dia] = dataInput.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private async inicializarHorarios(): Promise<void> {
    if (this.medicoSelecionado?.tempoConsultaMinutos) {
      this.Hora = this.gerarHorariosDinamicos(this.medicoSelecionado.tempoConsultaMinutos);
    } else {
      this.Hora = [...HoradaConsulta];
    }

    // Buscar horários ocupados para a data atual
    const dataAtual = this.FormGroupConsulta.get('data')?.value;
    if (dataAtual) {
      await this.buscarHorariosDisponiveis(dataAtual);
    }
  }

  // ==================== PESQUISA DE PACIENTES ====================
  async PesquisarPacientes(): Promise<void> {
    const pesquisa = this.FormGroupConsulta.get('PesquisaPaciente')?.value?.trim();
    const filtro = this.FormGroupConsulta.get('FiltroPesquisaPaciente')?.value;

    if (!pesquisa && filtro !== 5) {
      this.notificacao.fire('Atenção', 'Digite algo para pesquisar', 'warning');
      return;
    }

    try {
      const dados = await this.pacienteApi.pesquisarComFiltro(filtro, pesquisa, 'ATIVO').toPromise();
      this.dadosPacientePassandoTabela = dados || [];
      this.showResultadoPaciente = true;

      if (this.dadosPacientePassandoTabela.length === 0) {
        this.notificacao.fire('Aviso', 'Nenhum paciente encontrado', 'info');
      }
    } catch (error) {
      console.error('Erro ao pesquisar pacientes:', error);
      this.notificacao.fire('Erro', 'Erro ao pesquisar pacientes', 'error');
    }
  }

  fecharTabelaPacinte(): void {
    this.showResultadoPaciente = false;
    this.FormGroupConsulta.patchValue({ PesquisaPaciente: '' });
  }

  PacienteSelecionado(paciente: Paciente): void {
    this.pacienteSelecionado = paciente;
    //    this.consulta.pacienteId = paciente.codigo;
    //   this.consulta.pacienteNome = paciente.nome;
    this.showResultadoPaciente = false;
    this.FormGroupConsulta.patchValue({ PesquisaPaciente: '' });

    this.notificacao.fire({
      icon: 'success',
      title: 'Paciente selecionado',
      text: paciente.nome,
      timer: 1500,
      showConfirmButton: false
    });
  }

  // ==================== PESQUISA DE MÉDICOS ====================
  async PesquisarMedicosFiltro(): Promise<void> {
    const pesquisa = this.FormGroupConsulta.get('PesquisaMedico')?.value?.trim();
    const filtro = this.FormGroupConsulta.get('FiltroPesquisaMedico')?.value;

    if (!pesquisa && filtro !== 5) {
      this.notificacao.fire('Atenção', 'Digite algo para pesquisar', 'warning');
      return;
    }

    try {
      const dados = await this.profissionalApiService.pesquisarComFiltro(filtro, pesquisa, 'ATIVO').toPromise();
      this.dadosMedicoPassandoTabela = dados || [];
      this.showResultadoMedico = true;

      if (this.dadosMedicoPassandoTabela.length === 0) {
        this.notificacao.fire('Aviso', 'Nenhum médico encontrado', 'info');
      }
    } catch (error) {
      console.error('Erro ao pesquisar médicos:', error);
      this.notificacao.fire('Erro', 'Erro ao pesquisar médicos', 'error');
    }
  }

  fecharTabelaMedicos(): void {
    this.showResultadoMedico = false;
    this.FormGroupConsulta.patchValue({ PesquisaMedico: '' });
  }

  MedicoSelecionado(medico: Profissional): void {
    this.medicoSelecionado = medico;
    const medicoId = (medico as any).id ?? medico.codigo;
    this.consulta.profissionalId = medicoId;
    this.consulta.profissionalNome = medico.nome;
    this.consulta.profissionalConselho = medico.registroConselho;
    this.showResultadoMedico = false;
    this.FormGroupConsulta.patchValue({ PesquisaMedico: '' });

    // Atualizar horários baseado no tempo de consulta do médico
    if (medico.tempoConsultaMinutos) {
      this.Hora = this.gerarHorariosDinamicos(medico.tempoConsultaMinutos);
    }

    // Buscar horários disponíveis se já tiver uma data selecionada
    const dataAtual = this.FormGroupConsulta.get('data')?.value;
    if (dataAtual) {
      this.buscarHorariosDisponiveis(dataAtual);
    } else {
      // Se não tiver data, apenas restaurar os horários base
      this.Hora = medico.tempoConsultaMinutos
        ? this.gerarHorariosDinamicos(medico.tempoConsultaMinutos)
        : [...HoradaConsulta];
    }

    this.notificacao.fire({
      icon: 'success',
      title: 'Médico selecionado',
      text: medico.nome,
      timer: 1500,
      showConfirmButton: false
    });
  }

  // ==================== HORÁRIOS ====================
  async onDateChange(event: Event): Promise<void> {
    const selectedDate = (event.target as HTMLInputElement).value;

    if (!selectedDate) {
      return;
    }

    // Limpar seleção de horário atual quando trocar a data
    this.FormGroupConsulta.patchValue({ horario: '' });

    await this.buscarHorariosDisponiveis(selectedDate);
  }

  private async buscarHorariosDisponiveis(data: string): Promise<void> {
    if (!this.consulta.profissionalId) {
      this.notificacao.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione um médico primeiro',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    this.carregandoHorarios = true;
    this.Hora = [];

    try {
      const novoIntervalo = this.medicoSelecionado?.tempoConsultaMinutos;
      const horariosOcupados = await this.consultaApi
        .buscarHorariosOcupadosComDuracao(this.consulta.profissionalId, data, novoIntervalo || DURACAO_PADRAO_MINUTOS)
        .toPromise();


      // O horário da consulta editada só é liberado na data original; em outra data ele não pertence a ela
      const mesmaDataOriginal = data === formatarDataLocal(new Date(this.consulta.dataHora));
      const horarioAtual = formatarHoraLocal(new Date(this.consulta.dataHora));
      const ocupadosFiltrados = (horariosOcupados || []).filter(
        horario => !mesmaDataOriginal || horario.inicio.substring(0, 5) !== horarioAtual
      );

      if (!novoIntervalo) {
        // Sem tempo de consulta definido: usa horários padrão e filtra os ocupados
        const ocupadosFormatados = ocupadosFiltrados.map(h => h.inicio.substring(0, 5));
        this.Hora = [...HoradaConsulta].filter(
          h => !ocupadosFormatados.includes(h.value.substring(0, 5))
        );
      } else {
        this.gerarHorariosRespeitandoOcupados(novoIntervalo, ocupadosFiltrados);
      }

      if (this.Hora.length === 0) {
        this.notificacao.fire({
          icon: 'info',
          title: 'Sem horários disponíveis',
          text: 'Não há horários disponíveis para esta data. Escolha outra data.',
          confirmButtonColor: '#0066CC'
        });
      }

    } catch (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      this.notificacao.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Falha ao buscar horários disponíveis!',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      this.carregandoHorarios = false;
    }
  }

  /**
   * Gera horários disponíveis respeitando consultas já existentes.
   *
   * Identifica grupos contíguos de horários ocupados e gera novos slots
   * com o novo intervalo nos espaços livres entre eles.
   * Dentro de cada espaço livre, os slots começam exatamente no início do espaço
   * (ex.: fim do último bloco ocupado) e avançam com o novo intervalo.
   *
   * @param novoIntervalo Novo tempo de consulta em minutos
   * @param horariosOcupados Blocos ocupados: início "HH:mm:ss" e duração real em minutos
   */
  private gerarHorariosRespeitandoOcupados(novoIntervalo: number, horariosOcupados: HorarioOcupado[]): void {
    const inicioExpediente = 8 * 60;  // 08:00 em minutos
    const fimExpediente = 18 * 60;    // 18:00 em minutos

    // Se não há horários ocupados, gera normalmente com o novo intervalo
    if (!horariosOcupados || horariosOcupados.length === 0) {
      this.Hora = this.gerarHorariosDinamicos(novoIntervalo);
      return;
    }

    // Converte horários ocupados para minutos e ordena
    const ocupadosMinutos = horariosOcupados
      .map(h => {
        const partes = h.inicio.substring(0, 5).split(':');
        return {
          inicio: parseInt(partes[0]) * 60 + parseInt(partes[1]),
          duracao: h.duracaoMinutos > 0 ? h.duracaoMinutos : DURACAO_PADRAO_MINUTOS,
        };
      })
      .sort((a, b) => a.inicio - b.inicio);

    // Monta grupos contíguos de horários ocupados
    const gruposOcupados: { inicio: number; fim: number }[] = [];
    for (const { inicio, duracao } of ocupadosMinutos) {
      const fim = inicio + duracao;
      const ultimoGrupo = gruposOcupados[gruposOcupados.length - 1];
      if (ultimoGrupo && inicio <= ultimoGrupo.fim) {
        ultimoGrupo.fim = fim > ultimoGrupo.fim ? fim : ultimoGrupo.fim;
      } else {
        gruposOcupados.push({ inicio, fim });
      }
    }

    // Identifica os espaços livres
    const espacosLivres: { inicio: number; fim: number }[] = [];

    // Espaço antes do primeiro grupo ocupado
    if (gruposOcupados[0].inicio > inicioExpediente) {
      espacosLivres.push({ inicio: inicioExpediente, fim: gruposOcupados[0].inicio });
    }

    // Espaços entre grupos ocupados
    for (let i = 0; i < gruposOcupados.length - 1; i++) {
      espacosLivres.push({ inicio: gruposOcupados[i].fim, fim: gruposOcupados[i + 1].inicio });
    }

    // Espaço depois do último grupo ocupado
    const ultimoGrupo = gruposOcupados[gruposOcupados.length - 1];
    if (ultimoGrupo.fim < fimExpediente) {
      espacosLivres.push({ inicio: ultimoGrupo.fim, fim: fimExpediente });
    }

    // Gera slots com o novo intervalo em cada espaço livre
    this.Hora = [];
    for (const espaco of espacosLivres) {
      let atual = espaco.inicio;
      while (atual + novoIntervalo <= fimExpediente && atual < espaco.fim) {
        const horas = Math.floor(atual / 60);
        const minutos = atual % 60;
        const horarioFormatado = `${this.formatarNumero(horas)}:${this.formatarNumero(minutos)}`;
        this.Hora.push({ value: horarioFormatado, label: horarioFormatado });
        atual += novoIntervalo;
      }
    }
  }


  private gerarHorariosDinamicos(tempoConsultaMinutos: number): any[] {
    if (!tempoConsultaMinutos || tempoConsultaMinutos <= 0) {
      return [...HoradaConsulta];
    }

    const horarios: { value: string; label: string }[] = [];
    let horaAtual = 8 * 60; // 8:00 em minutos
    const fimDoDia = 18 * 60; // 18:00 em minutos

    while (horaAtual < fimDoDia) {
      const horas = Math.floor(horaAtual / 60);
      const minutos = horaAtual % 60;
      const horarioFormatado = `${this.formatarNumero(horas)}:${this.formatarNumero(minutos)}`;
      horarios.push({ value: horarioFormatado, label: horarioFormatado });
      horaAtual += tempoConsultaMinutos;
    }

    return horarios;
  }

  private formatarNumero(numero: number): string {
    return numero < 10 ? `0${numero}` : `${numero}`;
  }

  // ==================== SALVAR ====================
  Salvar(): void {
    if (this.FormGroupConsulta.invalid) {
      this.notificacao.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha todos os campos obrigatórios',
        confirmButtonColor: '#dc2626'
      });
      this.FormGroupConsulta.markAllAsTouched();
      return;
    }

    this.exibirConfirmacaoEdicao();
  }

  private exibirConfirmacaoEdicao(): void {
    const formValues = this.FormGroupConsulta.value;
    const formaPagamentoTexto = this.obterTextoPagamento(formValues.formaPagamento);
    const htmlConfirmacao = this.construirHtmlConfirmacao(formValues, formaPagamentoTexto);

    this.notificacao.fire({
      html: htmlConfirmacao,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '<i class="fa-solid fa-check"></i> Confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executarEdicao();
      }
    });
  }

  private obterTextoPagamento(id: number): string {
    return rotuloFormaPagamento(id);
  }

  /** Classes do ícone Font Awesome de cada forma de pagamento (id da tabela forma_pagamento). */
  iconeFormaPagamento(id: number): string {
    const icones: Record<number, string> = {
      1: 'fa-solid fa-user',
      2: 'fa-solid fa-hospital',
      3: 'fa-solid fa-credit-card',
      4: 'fa-solid fa-credit-card',
      5: 'fa-brands fa-pix',
      6: 'fa-solid fa-money-bill-wave',
    };
    return icones[id] ?? 'fa-solid fa-credit-card';
  }

  private construirHtmlConfirmacao(formValues: any, formaPagamento: string): string {
    return `
    <div style="text-align: left; font-family: system-ui, sans-serif;">
      <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Confirmar edição da consulta?</h3>
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
        <div style="display: grid; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <span style="color: #6b7280; min-width: 80px;">Médico:</span>
            <strong style="color: #1f2937;">${escaparHtml(this.consulta.profissionalNome)}</strong>
          </div>
          <div style="display: flex; gap: 8px;">
            <span style="color: #6b7280; min-width: 80px;">Paciente:</span>
            <strong style="color: #1f2937;">${escaparHtml(this.consulta.pacienteNome)}</strong>
          </div>
          <div style="display: flex; gap: 8px;">
            <span style="color: #6b7280; min-width: 80px;">Data:</span>
            <strong style="color: #1f2937;">${this.formatarDataExibicao(formValues.data)}</strong>
          </div>
          <div style="display: flex; gap: 8px;">
            <span style="color: #6b7280; min-width: 80px;">Horário:</span>
            <strong style="color: #1f2937;">${escaparHtml(formValues.horario)}</strong>
          </div>
          <div style="display: flex; gap: 8px;">
            <span style="color: #6b7280; min-width: 80px;">Valor:</span>
            <strong style="color: #059669;">R$ ${this.formatarValor(formValues.valor)}</strong>
          </div>
          <div style="display: flex; gap: 8px;">
            <span style="color: #6b7280; min-width: 80px;">Pagamento:</span>
            <strong style="color: #1f2937;">${escaparHtml(formaPagamento)}</strong>
          </div>
        </div>
        ${formValues.observacao ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 13px;">Observação:</span>
            <p style="margin: 4px 0 0 0; color: #374151; font-size: 13px;">${escaparHtml(formValues.observacao)}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  }

  private formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor || 0);
  }


  private montarObjetoConsulta(): any {
    const formValues = this.FormGroupConsulta.value;
    const dataHoraCompleta = `${formValues.data}T${formValues.horario}:00`;

    const profissionalId = (this.medicoSelecionado as any)?.id ?? this.medicoSelecionado?.codigo ?? this.consulta.profissionalId;
    const pacienteId = (this.pacienteSelecionado as any)?.id ?? (this.pacienteSelecionado as any)?.codigo ?? this.consulta.pacienteId;

    return {
      profissionalId,
      pacienteId,
      especialidadeId: this.consulta.especialidadeId,
      dataHora: dataHoraCompleta,
      duracaoMinutos: this.consulta.duracaoMinutos,
      observacoes: formValues.observacao || null,
      formaPagamentoId: formValues.formaPagamento,
      valor: parseFloat(formValues.valor) || 0, // INCLUIR VALOR
      status: this.consulta.status
    };
  }

  private executarEdicao(): void {
    const consultaAtualizada = this.montarObjetoConsulta();
    this.consultaApi.atualizarConsultabyOrg(this.consulta.id, consultaAtualizada).subscribe({
      next: () => this.exibirSucessoEdicao(),
      error: (erro) => this.exibirErroEdicao(erro)
    });
  }

  private exibirSucessoEdicao(): void {
    this.notificacao.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: 'Consulta editada com sucesso.',
      confirmButtonColor: '#059669',
      timer: 2000
    }).then(() => {
      this.dialogRef.close('salvo');
    });
  }

  private exibirErroEdicao(erro: any): void {
    console.error('Erro ao editar consulta:', erro);
    const mensagem = extrairMensagemErro(erro) || 'Não foi possível editar a consulta. Tente novamente.';

    this.notificacao.fire({
      icon: 'error',
      title: 'Erro',
      text: mensagem,
      confirmButtonColor: '#dc2626'
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getEspecialidade(especialidades: any): string {
    if (!especialidades) {
      return 'Não informada';
    }

    // Se for array, pega o primeiro item
    if (Array.isArray(especialidades)) {
      if (especialidades.length === 0) {
        return 'Não informada';
      }
      return especialidades[0]?.nome || 'Não informada';
    }

    // Se for string, retorna diretamente
    if (typeof especialidades === 'string') {
      return especialidades;
    }

    // Se for objeto com propriedade nome
    if (especialidades.nome) {
      return especialidades.nome;
    }

    return 'Não informada';
  }
}
