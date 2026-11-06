import { filter, take } from 'rxjs';
import { Component, OnInit, Inject, Optional, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { HoradaConsulta } from 'src/app/shared/constants/options';
import { Paciente } from 'src/app/shared/models/paciente';
import { Profissional } from 'src/app/shared/models/Profissional';
import { Usuario } from 'src/app/shared/models/usuario';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { ConsultaStateService } from 'src/app/features/agenda/data-access/consulta-state.service';
import { PacienteApiService } from 'src/app/core/data-access/paciente-api.service';
import { ProfissionalApiService } from 'src/app/core/data-access/profissional-api.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { TabelaDePacientesComponent } from '../nova-consuta/tabela-de-pacientes/tabela-de-pacientes.component';
import { TabelasPesquisasMedicosComponent } from '../nova-consuta/tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';
import { CadastroPacienteComponent } from '../../pages/cadastro-paciente/cadastro-paciente.component';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { idFormaPagamentoPorRotulo } from 'src/app/shared/constants/forma-pagamento.constant';
import { formatarDataLocal, formatarHoraLocal } from 'src/app/shared/utils/data-local';

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
    private notificacao: NotificacaoService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AgendarConsultaComponent>,
    private pacienteApi: PacienteApiService,
    private profissionalApi: ProfissionalApiService,
    private consultaApi: ConsultaApiService,
    private consultaState: ConsultaStateService,
    private authService: AuthService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: AgendarConsultaData
  ) {
    this.authService.currentUser$.pipe(filter(Boolean), take(1)).subscribe(u => {
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

    const data = dataHora ? formatarDataLocal(dataHora) : '';

    const hora = dataHora ? formatarHoraLocal(dataHora) : '';

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
        this.notificacao.fire('Erro', 'Erro ao pesquisar pacientes', 'error');
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
        this.notificacao.fire('Erro', 'Erro ao pesquisar clínicos', 'error');
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
      this.notificacao.fire({ icon: 'warning', title: 'Atenção', text: 'O clínico não informou o tempo de consulta. Serão usados os horários padrão.' });
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
        this.Hora.push({ value: formatarHoraLocal(cur), label: formatarHoraLocal(cur) });
        cur = new Date(cur.getTime() + novoIntervalo * 60000);
      }
    }
  }

  private _gerarHorariosLivres(intervalo: number): void {
    let cur = this._toDate('08:00');
    const end = this._toDate('18:00');
    this.Hora = [];
    while (cur <= end) {
      this.Hora.push({ value: formatarHoraLocal(cur), label: formatarHoraLocal(cur) });
      cur = new Date(cur.getTime() + intervalo * 60000);
    }
  }

  private _toDate(time: string): Date {
    const [h, m] = time.split(':').map(Number);
    return new Date(2000, 0, 1, h, m, 0, 0);
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
      this.notificacao.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha todos os campos obrigatórios.' });
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
      if (existe) { this.notificacao.mostrarSnackbar('Ja Existe uma consulta marcadas para esse dia com esse horário.\nTente outro horário. Ou altere o dia.', 10000); this.FormularioConsulta.reset(); return; }

      this.consultaApi.cadastrarConsultaByOrg(consult).subscribe(
        response => {
          this.notificacao.fire({ icon: 'success', title: 'Agendado!', text: `Consulta agendada com sucesso. Código: ${response.id}` })
            .then(r => { if (r.isConfirmed) { this._limpar(); this.consultaState.setCadastroRealizado(response); this.dialogRef.close(response); } });
        },
        () => this.notificacao.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível agendar a consulta.' })
      );
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      this.notificacao.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível verificar a disponibilidade do horário. Tente novamente.' });
    }
  }

  private async _salvarEdicao(): Promise<void> {
    if (!this.consultaOriginal) return;

    const fp   = this._transformaFormaPagamento();
    const hora = this.FormularioConsulta.get('Hora')?.value;
    const obs  = this.FormularioConsulta.get('observacao')?.value;
    const val  = this.FormularioConsulta.get('valor')?.value;
    const data = this.FormularioConsulta.get('date')?.value;
    // NaN (campo vazio) mantém o valor original; 0 é um valor válido
    const valorInformado = parseFloat(val);

    const payload: any = {
      id:               this.consultaOriginal.id,
      profissionalId:   this.Medico?.id || this.consultaOriginal.profissionalId,
      pacienteId:       this.Paciente?.codigo || this.consultaOriginal.pacienteId,
      dataHora:         data && hora ? `${data}T${hora}` : this.consultaOriginal.dataHora,
      especialidadeId:  this._resolverEspecialidadeId(),
      duracaoMinutos:   this.Medico?.tempoConsultaMinutos || this.consultaOriginal.duracaoMinutos || null,
      observacoes:      obs,
      formaPagamentoId: fp || this.consultaOriginal.formaPagamentoId,
      valor:            Number.isNaN(valorInformado) ? this.consultaOriginal.valor : valorInformado
    };

    this.consultaApi.atualizarConsultabyOrg(this.consultaOriginal.id, payload).subscribe(
      response => {
        this.notificacao.fire({ icon: 'success', title: 'Atualizado!', text: 'Consulta atualizada com sucesso.' })
          .then(() => { this.consultaState.setCadastroRealizado(response); this.dialogRef.close(response); });
      },
      () => this.notificacao.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível salvar as alterações.' })
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
    return idFormaPagamentoPorRotulo(this.FormularioConsulta.get('Pagamento')?.value);
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
