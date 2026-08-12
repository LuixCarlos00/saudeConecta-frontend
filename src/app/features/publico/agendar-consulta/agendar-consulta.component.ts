import { Component, OnInit, Inject, Optional, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { HoradaConsulta } from 'src/app/util/variados/options/options';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { TabelaDePacientesComponent } from '../../administrador/gerenciamento-agenda/nova-consuta/tabela-de-pacientes/tabela-de-pacientes.component';
import { TabelasPesquisasMedicosComponent } from '../../administrador/gerenciamento-agenda/nova-consuta/tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';
import { CadastroPacienteComponent } from '../../administrador/cadastros/cadastro-paciente/cadastro-paciente.component';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';

export interface AgendarConsultaData {
  /** Quando passado, o componente opera em modo edição */
  consulta?: Consultav2;
}

@Component({
  selector: 'app-agendar-consulta',
  templateUrl: './agendar-consulta.component.html',
  styleUrls: ['./agendar-consulta.component.css']
})
export class AgendarConsultaComponent implements OnInit {

  // ── Modo ───────────────────────────────────────────────
  modoEdicao = false;
  consultaOriginal: Consultav2 | null = null;

  // ── Formulários ────────────────────────────────────────
  FormularioPaciente!: FormGroup;
  FormularioMedicos!: FormGroup;
  FormularioConsulta!: FormGroup;

  // ── Entidades selecionadas ─────────────────────────────
  Medico: Profissional = {
    codigo: 0, nome: '', especialidades: '', registroConselho: '',
    tempoConsultaMinutos: 0, email: '', telefone: '', sexo: 0,
    dataNacimento: '', cpf: '', rg: '', formacao: '', instituicao: '',
    nacionalidade: '', uf: '', municipio: '', bairro: '', cep: '',
    rua: '', numero: 0, complemento: '', id: 0, valorConsulta: 0
  };

  Paciente: Paciente = {
    codigo: 0, nome: '', dataNascimento: '', cpf: '',
    rg: '', email: '', telefone: '', status: 0
  };

  UsuarioLogado: Usuario = { id: 0, aud: '', exp: '', iss: '', sub: '' };

  // ── Hora / Calendário ──────────────────────────────────
  DiaDaSemana = '';
  MostraHora = false;
  Hora = HoradaConsulta;
  horariosDisponiveis: string[] = [];
  DataSelecionada: any;

  // ── Navegação de seções ────────────────────────────────
  secaoVisivel = 'clinico';

  @ViewChild('scrollArea') scrollAreaRef!: ElementRef<HTMLElement>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AgendarConsultaComponent>,
    private pacienteApi: PacienteApiService,
    private profissionalApi: ProfissionalApiService,
    private consultaApi: ConsultaApiService,
    private consultaState: ConsultaStateService,
    private tokenService: tokenService,
    private dialogService: DialogService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: AgendarConsultaData
  ) {
    this.tokenService.UsuarioLogadoValue$.subscribe(u => {
      if (u) this.UsuarioLogado = u;
    });
  }

  ngOnInit(): void {
    this._initForms();

    if (this.data?.consulta) {
      this.modoEdicao = true;
      this.consultaOriginal = this.data.consulta;
      this._preencherModoEdicao(this.data.consulta);
    }
  }

  // ── Init dos formulários ───────────────────────────────

  private _initForms(): void {
    this.FormularioMedicos = this.fb.group({
      PesquisaMedicos: [''],
      OptionsFindMedicos: [5]
    });

    this.FormularioPaciente = this.fb.group({
      PesquisaPaciente: [''],
      OptionsFindPaciente: [5]
    });

    this.FormularioConsulta = this.fb.group({
      observacao: [''],
      date: [''],
      Hora: [''],
      Pagamento: [''],
      valor: [null, [Validators.required, Validators.min(0)]]
    });
  }

  // ── Preencher modo edição ──────────────────────────────

  private _preencherModoEdicao(c: Consultav2): void {
    const dataHora = c.dataHora ? new Date(c.dataHora) : null;

    const data = dataHora
      ? `${dataHora.getFullYear()}-${String(dataHora.getMonth() + 1).padStart(2, '0')}-${String(dataHora.getDate()).padStart(2, '0')}`
      : '';

    const hora = dataHora
      ? `${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`
      : '';

    this.FormularioConsulta.patchValue({
      date: data,
      Hora: hora,
      Pagamento: c.formaPagamentoNome || '',
      valor: c.valor || null,
      observacao: c.observacoes || ''
    });

    if (c.pacienteNome) {
      this.Paciente = {
        codigo: c.pacienteId ?? 0,
        nome: c.pacienteNome,
        cpf: '',
        rg: '',
        email: '',
        telefone: c.pacienteTelefone || '',
        dataNascimento: '',
        status: 0
      };
    }

    if (c.profissionalNome) {
      this.Medico = {
        ...this.Medico,
        id: c.profissionalId ?? 0,
        nome: c.profissionalNome,
        tempoConsultaMinutos: c.duracaoMinutos ?? 0
      };
      this.MostraHora = true;
      this.DataSelecionada = data;
      this._carregarProfissionalCompleto(c.profissionalId);
    }

    if (data) {
      const d = new Date(data + 'T00:00:00');
      const options = { weekday: 'long' as const };
      this.DiaDaSemana = new Intl.DateTimeFormat('pt-BR', options).format(d);
    }
  }

  /**
   * Carrega o cadastro completo do profissional da consulta em edicao.
   * Necessario porque a consulta traz apenas nome e id do profissional,
   * e a especialidade dele e obrigatoria no payload de atualizacao.
   *
   * @param profissionalId id do profissional vinculado a consulta
   */
  private _carregarProfissionalCompleto(profissionalId: number | undefined): void {
    if (!profissionalId) return;

    this.profissionalApi.buscarClinicoIdByOrg(profissionalId).subscribe({
      next: profissional => {
        if (profissional) {
          this.Medico = { ...profissional, ...this.Medico, especialidades: profissional.especialidades };
        }
      },
      error: () => {
        // Mantem os dados minimos vindos da consulta; a especialidade original sera reaproveitada.
      }
    });
  }

  // ── Navegação de seções ────────────────────────────────

  irParaSecao(id: string): void {
    this.secaoVisivel = id;
    const el = document.getElementById('sec-' + id);
    if (el && this.scrollAreaRef) {
      this.scrollAreaRef.nativeElement.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
    }
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const secoes = ['clinico', 'paciente', 'detalhes', 'pagamento', 'observacoes'];
    for (const id of secoes) {
      const el = document.getElementById('sec-' + id);
      if (el && el.offsetTop - 32 <= container.scrollTop + 1) {
        this.secaoVisivel = id;
      }
    }
  }

  // ── Busca ──────────────────────────────────────────────

  async Pesquisar(tipo: 'paciente' | 'medico'): Promise<void> {
    if (tipo === 'paciente') {
      const filtro = this.FormularioPaciente.get('OptionsFindPaciente')?.value;
      const texto: string = this.FormularioPaciente.get('PesquisaPaciente')?.value;
      try {
        const dados = await this.pacienteApi.pesquisarComFiltro(filtro, texto, 'ATIVO').toPromise();
        this._abrirTabela(dados, 'paciente');
      } catch {
        Swal.fire('Erro', 'Erro ao pesquisar pacientes', 'error');
      }
    }

    if (tipo === 'medico') {
      const filtro = this.FormularioMedicos.get('OptionsFindMedicos')?.value;
      const texto: string = this.FormularioMedicos.get('PesquisaMedicos')?.value;
      this.FormularioConsulta.patchValue({ date: '', Hora: '' });
      try {
        const dados = await this.profissionalApi.pesquisarComFiltro(filtro, texto, 'ATIVO').toPromise();
        this._abrirTabela(dados, 'medico');
      } catch {
        Swal.fire('Erro', 'Erro ao pesquisar clínicos', 'error');
      }
    }
  }

  private _abrirTabela(dados: any, tipo: 'paciente' | 'medico'): void {
    if (tipo === 'paciente') {
      this.dialog.open(TabelaDePacientesComponent, { width: '800px', data: dados })
        .afterClosed().subscribe(result => { if (result) this.Paciente = result; });
    } else {
      this.dialog.open(TabelasPesquisasMedicosComponent, { width: '800px', data: dados })
        .afterClosed().subscribe(result => {
          if (result) {
            this.Medico = result;
            this.MostraHora = true;
            if (this.Medico.valorConsulta) {
              this.FormularioConsulta.patchValue({ valor: this.Medico.valorConsulta });
            }
          }
        });
    }
  }

  AdicionarPaciente(): void {
    this.dialog.open(CadastroPacienteComponent, {
      width: '90vw', maxWidth: '900px', maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
  }

  // ── Data / Horários ────────────────────────────────────

  onDateChange(event: Event): void {
    const selectedDate = this.FormularioConsulta.get('date')?.value;
    const date = new Date(selectedDate + 'T00:00:00');
    const options = { weekday: 'long' as const };
    this.DiaDaSemana = new Intl.DateTimeFormat('pt-BR', options).format(date);
    this.DataSelecionada = selectedDate;
    if (this.MostraHora) {
      this._verificarHorarios(selectedDate);
    }
  }

  private _verificarHorarios(selectedDate: Date): void {
    this.horariosDisponiveis = [];
    if (!this.Medico || !selectedDate) return;

    if (!this.Medico.tempoConsultaMinutos) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'O clínico não informou o tempo de consulta. Serão usados os horários padrão.' });
      this.Hora = [...HoradaConsulta];
      return;
    }

    this.consultaApi.buscarHorariosOcupadosByOrg(this.Medico.id!, selectedDate as any).subscribe(
      data => {
        this.horariosDisponiveis = data;
        this._gerarHorariosRespeitandoOcupados(this.Medico.tempoConsultaMinutos!, data);
      },
      () => this._gerarHorariosLivres(this.Medico.tempoConsultaMinutos!)
    );
  }

  private _gerarHorariosRespeitandoOcupados(novoIntervalo: number, horariosOcupados: string[]): void {
    const startTime = this._toDate('08:00');
    const endTime   = this._toDate('18:00');

    if (!horariosOcupados?.length) { this._gerarHorariosLivres(novoIntervalo); return; }

    const ocupados = horariosOcupados.map(h => this._toDate(h.substring(0, 5))).sort((a, b) => a.getTime() - b.getTime());
    let intervaloAntigo = novoIntervalo;
    if (ocupados.length >= 2) intervaloAntigo = (ocupados[1].getTime() - ocupados[0].getTime()) / 60000;

    const grupos: { inicio: Date; fim: Date }[] = [];
    for (const inicio of ocupados) {
      const fim = new Date(inicio.getTime() + intervaloAntigo * 60000);
      const ult = grupos[grupos.length - 1];
      if (ult && inicio.getTime() <= ult.fim.getTime()) {
        ult.fim = fim.getTime() > ult.fim.getTime() ? fim : ult.fim;
      } else {
        grupos.push({ inicio, fim });
      }
    }

    const intervalos: { inicio: Date; fim: Date }[] = [];
    if (grupos[0].inicio.getTime() > startTime.getTime()) intervalos.push({ inicio: startTime, fim: grupos[0].inicio });
    for (let i = 0; i < grupos.length - 1; i++) intervalos.push({ inicio: grupos[i].fim, fim: grupos[i + 1].inicio });
    const ult = grupos[grupos.length - 1];
    if (ult.fim.getTime() < endTime.getTime()) intervalos.push({ inicio: ult.fim, fim: endTime });

    this.Hora = [];
    for (const iv of intervalos) {
      let cur = new Date(iv.inicio.getTime());
      while (cur.getTime() + novoIntervalo * 60000 <= endTime.getTime() && cur.getTime() < iv.fim.getTime()) {
        this.Hora.push({ value: this._fmtTime(cur), label: this._fmtTime(cur) });
        cur = new Date(cur.getTime() + novoIntervalo * 60000);
      }
    }
  }

  private _gerarHorariosLivres(intervalo: number): void {
    let cur = this._toDate('08:00');
    const end = this._toDate('18:00');
    this.Hora = [];
    while (cur <= end) {
      this.Hora.push({ value: this._fmtTime(cur), label: this._fmtTime(cur) });
      cur = new Date(cur.getTime() + intervalo * 60000);
    }
  }

  private _toDate(time: string): Date {
    const [h, m] = time.split(':').map(Number);
    return new Date(2000, 0, 1, h, m, 0, 0);
  }

  private _fmtTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  // ── Submissão ──────────────────────────────────────────

  async confirmar(): Promise<void> {
    if (this.modoEdicao) {
      await this._salvarEdicao();
    } else {
      await this._agendarNovaConsulta();
    }
  }

  private async _agendarNovaConsulta(): Promise<void> {
    const fp   = this._transformaFormaPagamento();
    const hora = this.FormularioConsulta.get('Hora')?.value;
    const obs  = this.FormularioConsulta.get('observacao')?.value;
    const val  = this.FormularioConsulta.get('valor')?.value;

    if (!this.Medico?.id || !this.Paciente?.codigo || !this.DataSelecionada || !fp || !hora || val === null) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    const especialidade = this.Medico.especialidades as any;
    const consult: any = {
      profissionalId:   this.Medico.id,
      pacienteId:       this.Paciente.codigo,
      dataHora:         `${this.DataSelecionada}T${hora}`,
      especialidadeId:  especialidade?.[0]?.id || null,
      duracaoMinutos:   this.Medico.tempoConsultaMinutos || null,
      observacoes:      obs,
      formaPagamentoId: fp,
      valor:            parseFloat(val) || 0
    };

    try {
      const existe = await this.consultaApi.verificarDisponibilidadeByOrg(this.DataSelecionada, hora, this.Medico.id).toPromise();
      if (existe) { this.dialogService.JaexisteDadosCAdastradosComEssesParamentros(); this.FormularioConsulta.reset(); return; }

      this.consultaApi.cadastrarConsultaByOrg(consult).subscribe(
        response => {
          Swal.fire({ icon: 'success', title: 'Agendado!', text: `Consulta agendada com sucesso. Código: ${response.id}` })
            .then(r => { if (r.isConfirmed) { this._limpar(); this.consultaState.setCadastroRealizado(response); this.dialogRef.close(response); } });
        },
        () => Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível agendar a consulta.' })
      );
    } catch {
      this.dialogService.JaexisteDadosCAdastradosComEssesParamentros();
      this.FormularioConsulta.reset();
    }
  }

  private async _salvarEdicao(): Promise<void> {
    if (!this.consultaOriginal) return;

    const fp   = this._transformaFormaPagamento();
    const hora = this.FormularioConsulta.get('Hora')?.value;
    const obs  = this.FormularioConsulta.get('observacao')?.value;
    const val  = this.FormularioConsulta.get('valor')?.value;
    const data = this.FormularioConsulta.get('date')?.value;

    const payload: any = {
      id:               this.consultaOriginal.id,
      profissionalId:   this.Medico?.id || this.consultaOriginal.profissionalId,
      pacienteId:       this.Paciente?.codigo || this.consultaOriginal.pacienteId,
      dataHora:         data && hora ? `${data}T${hora}` : this.consultaOriginal.dataHora,
      especialidadeId:  this._resolverEspecialidadeId(),
      duracaoMinutos:   this.Medico?.tempoConsultaMinutos || this.consultaOriginal.duracaoMinutos || null,
      observacoes:      obs,
      formaPagamentoId: fp || this.consultaOriginal.formaPagamentoId,
      valor:            parseFloat(val) || this.consultaOriginal.valor
    };

    this.consultaApi.atualizarConsultabyOrg(this.consultaOriginal.id, payload).subscribe(
      response => {
        Swal.fire({ icon: 'success', title: 'Atualizado!', text: 'Consulta atualizada com sucesso.' })
          .then(() => { this.consultaState.setCadastroRealizado(response); this.dialogRef.close(response); });
      },
      () => Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível salvar as alterações.' })
    );
  }

  // ── Helpers ────────────────────────────────────────────

  /**
   * Resolve a especialidade a ser enviada na atualizacao da consulta.
   * Usa a especialidade do medico selecionado (caso tenha sido trocado)
   * e recai na especialidade ja gravada na consulta.
   *
   * @returns id da especialidade ou null quando nao houver nenhuma disponivel
   */
  private _resolverEspecialidadeId(): number | null {
    const especialidades = this.Medico?.especialidades as any;
    return especialidades?.[0]?.id ?? this.consultaOriginal?.especialidadeId ?? null;
  }

  private _transformaFormaPagamento(): number {
    const v = this.FormularioConsulta.get('Pagamento')?.value;
    const map: Record<string, number> = {
      'Particular': 1, 'Convênio': 2, 'Cartão de Crédito': 3,
      'Cartão de Débito': 4, 'PIX': 5, 'Dinheiro': 6
    };
    return map[v] ?? 0;
  }

  private _limpar(): void {
    this.FormularioPaciente.reset();
    this.FormularioMedicos.reset();
    this.FormularioConsulta.reset();
    this.FormularioPaciente.patchValue({ OptionsFindPaciente: 5 });
    this.FormularioMedicos.patchValue({ OptionsFindMedicos: 5 });
    this.Paciente = {} as Paciente;
    this.Medico   = {} as Profissional;
    this.DataSelecionada = null;
    this.MostraHora = false;
  }

  fechar(): void {
    this.dialogRef.close();
  }

  getPrimeiraEspecialidade(profissional: any): string {
    if (!profissional?.especialidades?.length) return 'Não informado';
    return profissional.especialidades[0].nome;
  }

  formatarValor(valor: number): string {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }
}
