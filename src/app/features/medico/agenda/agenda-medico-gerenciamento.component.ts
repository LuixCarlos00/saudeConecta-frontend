import { ProntuarioDentistaApiService } from './../../../services/api/prontuario-dentista-api.service';
import { SolicitacaoExamesDentistaComponent } from './../impressoes-dentista/solicitacao-exames-dentista/solicitacao-exames-dentista.component';
import { RegistroConsultaDentistaComponent } from './../impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { Tabela } from 'src/app/util/variados/interfaces/tabela/Tabela';
import { CalendarDialogComponent } from 'src/app/util/variados/Cronologia/cronologia.component';
import { ObservacoesComponent } from 'src/app/features/administrador/gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
import { ImprimirPrescricaoComponent } from '../impressoes/ImprimirPrescricao/ImprimirPrescricao.component';
import { ImprimirSoliciatacaoDeExamesComponent } from '../impressoes/ImprimirSoliciatacaoDeExames/ImprimirSoliciatacaoDeExames.component';
import { AtestadoPacienteComponent } from '../impressoes/AtestadoPaciente/AtestadoPaciente.component';
import { HistoricoCompletoComponent } from '../impressoes/historicoCompleto/historicoCompleto.component';
import { HistoricoCompletoDentistaComponent } from '../impressoes-dentista/historico-completo-dentista/historico-completo-dentista.component';
import { ImprimirRegistroComponent } from '../impressoes/ImprimirRegistro/ImprimirRegistro.component';
import { SelecaoRelatorioComponent } from '../impressoes/selecao-relatorio/selecao-relatorio.component';
import { Subject, takeUntil } from 'rxjs';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { PrescricaoDentistaComponent } from '../impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { AtestadoDentistaComponent } from '../impressoes-dentista/atestado-dentista/atestado-dentista.component';

type TipoVisualizacao = 'AGENDADA' | 'REALIZADA';
type TipoPeriodo = 'diario' | 'semanal' | 'mensal' | 'anual';

const STATUS_AGENDADAS = ['AGENDADA'];
const STATUS_FINALIZADAS = ['REALIZADA'];

@Component({
  selector: 'app-agenda-medico-gerenciamento',
  templateUrl: './agenda-medico-gerenciamento.component.html',
  styleUrls: ['./agenda-medico-gerenciamento.component.scss'],
})
export class AgendaMedicoGerenciamentoComponent implements OnInit, OnDestroy {
  FormularioAgenda!: FormGroup;
  dataSource: Consultav2[] = [];
  allConsultas: any[] = [];
  displayedColumns: string[] = ['consulta', 'paciente', 'diaSemana', 'data', 'horario', 'Seleciona'];
  Finalizadas = false;
  clickedRows = new Set<Tabela>();
  tipoPeriodoSelecionado: TipoPeriodo = 'diario';
  today = new Date();
  private destroy$ = new Subject<void>();
  private dadosCarregados = false;

  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private tabelaAgendaMedicoService: ConsultaApiService,
    private prontuarioStateService: ProntuarioStateService,
    private prontuarioApiService: ProntuarioApiService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService,
    public dialog: MatDialog,
    private tokenService: tokenService
  ) { }

  ngOnInit() {
    this.FormularioAgenda = this.formBuilder.group({
      busca: [''],
    });

    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$
      .pipe(takeUntil(this.destroy$))
      .subscribe((usuario) => {
        if (usuario && usuario.id && !this.dadosCarregados) {
          this.UsuarioLogado = usuario;
          this.dadosCarregados = true;
          this.buscarDadosParaTabela();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async buscarDadosParaTabela() {
    try {
      const dados = await this.buscarConsultasPorPeriodo();
      if (Array.isArray(dados)) {
        const tipoVisualizacao: TipoVisualizacao = this.Finalizadas ? 'REALIZADA' : 'AGENDADA';
        const consultasFiltradas = this.filtrarConsultasPorTipo(dados, tipoVisualizacao);
        this.dataSource = [...consultasFiltradas];
        console.log('this.dataSource', this.dataSource);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Erro ao buscar dados da tabela.', 'error');
    }
  }

  PesquisarNaTabelaConcluidos() {
    this.Finalizadas = true;
    this.buscarDadosParaTabela();
  }

  selecionarPeriodo(periodo: TipoPeriodo) {
    this.tipoPeriodoSelecionado = periodo;
    this.buscarDadosParaTabela();
  }

  private async buscarConsultasPorPeriodo(): Promise<any[]> {
    const usuarioID = this.UsuarioLogado.id;
    const dados = await this.tabelaAgendaMedicoService
      .buscarAgendaMedico(usuarioID, this.tipoPeriodoSelecionado)
      .toPromise();
    console.log('Consultas recebidas do backend:', dados);
    if (!dados) { return []; }
    this.allConsultas = dados;
    return dados;
  }

  async Pesquisar() {
    const busca = this.FormularioAgenda.get('busca')?.value;
    this.FormularioAgenda.reset();
    try {
      const dados = await this.filtrandoDadosDoBancoPassadoParametros_Pesquisa(busca, this.dataSource);
      if (dados.length > 0) {
        this.dataSource = dados;
      } else {
        this.buscarDadosParaTabela();
        Swal.fire('Erro', 'Pesquisa não encontrada.', 'error');
      }
    } catch (error) {
      Swal.fire('Erro', 'Falha ao fazer a busca.', 'error');
      console.error(error);
    }
  }

  Recarregar() {
    this.allConsultas = [];
    this.buscarDadosParaTabela();
  }

  PesquisarNaTabelaAgendadas() {
    this.Finalizadas = false;
    this.buscarDadosParaTabela();
  }

  Observacoes(observacoes: string): void {
    this.dialog.open(ObservacoesComponent, {
      width: 'auto',
      data: { observacoes },
    });
  }

  CronogramaDoDia() {
    this.dialog.open(CalendarDialogComponent, {
      width: 'auto',
      maxWidth: 'auto',
      panelClass: 'cronologia-dialog',
      data: { Pesquisa: this.Finalizadas },
    });
  }

  IniciarConsulta(element: any) {
    console.log('IniciarConsulta - elemento selecionado:', element);
    const dataFormatada = element.dataHora
      ? new Date(element.dataHora).toLocaleDateString('pt-BR')
      : 'Não informada';
    const horarioFormatado = element.dataHora
      ? new Date(element.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Não informado';

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
          this.prontuarioStateService.changeConsulta(element);
          if (this.UsuarioLogado.perfil === 'MEDICO') {
            this.router.navigate(['startconsulta']);
          } else if (this.UsuarioLogado.perfil === 'DENTISTA') {
            this.router.navigate(['startconsulta-dentista']);
          }
        });
      }
    });
  }

  AbrirOpcoesImpressao(element: Consultav2) {
    const consultaNaoRealizada = (element.status as any) === 'AGENDADA';
    console.log('AbrirOpcoesImpressao - elemento selecionado:', element);

    const dialogRef = this.dialog.open(SelecaoRelatorioComponent, {
      maxWidth: 'auto',
      panelClass: 'selecao-relatorio-dialog',
      data: { consulta: element, consultaNaoRealizada, isAdmin: false },
    });

    dialogRef.afterClosed().subscribe((opcaoSelecionada: string) => {
      if (!opcaoSelecionada) { return; }

      // Opção 3 = Histórico Completo (não precisa de prontuário)
      if (opcaoSelecionada === '3') {
        this.ImprimirHistoricoCompleto(element);
        return;
      }

      if (this.UsuarioLogado.perfil === 'MEDICO') {
        this.prontuarioApiService.buscarProntuarioById(element.id).subscribe(
          (dados: Prontuario) => this.abrirDialogMedico(opcaoSelecionada, dados),
          () => this.exibirErroProntuario()
        );
      } else if (this.UsuarioLogado.perfil === 'DENTISTA') {
        this.prontuarioDentistaApiService.buscarProntuarioDentistaById(element.id).subscribe(
          (dados: Prontuario) => this.abrirDialogDentista(opcaoSelecionada, dados),
          () => this.exibirErroProntuario()
        );
      }
    });
  }

  private abrirDialogMedico(opcao: string, dados: Prontuario) {
    const dialogWidth = '60%';
    const dialogHeight = '90%';
    switch (opcao) {
      case '1': this.dialog.open(ImprimirSoliciatacaoDeExamesComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
      case '2': this.dialog.open(ImprimirPrescricaoComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
      case '4': this.dialog.open(AtestadoPacienteComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
      case '5': this.dialog.open(ImprimirRegistroComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
    }
  }

  private abrirDialogDentista(opcao: string, dados: Prontuario) {
    const dialogWidth = '60%';
    const dialogHeight = '90%';
    switch (opcao) {
      case '1': this.dialog.open(SolicitacaoExamesDentistaComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
      case '2': this.dialog.open(PrescricaoDentistaComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
      case '4': this.dialog.open(AtestadoDentistaComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
      case '5': this.dialog.open(RegistroConsultaDentistaComponent, { width: dialogWidth, height: dialogHeight, data: dados }); break;
    }
  }

  private exibirErroProntuario() {
    Swal.fire({
      title: 'Prontuário não encontrado',
      html: `
        <p>Não foi possível encontrar o prontuário desta consulta.</p>
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          Verifique se a consulta foi realizada e se o prontuário foi preenchido corretamente.
        </p>
      `,
      icon: 'warning',
      confirmButtonColor: '#0066CC',
      confirmButtonText: 'Entendi',
    });
  }

  ImprimirHistoricoCompleto(dados: Consultav2) {
    const dialogConfig = { width: '60%', height: '90%', data: dados };
    if (this.UsuarioLogado.perfil === 'DENTISTA') {
      this.dialog.open(HistoricoCompletoDentistaComponent, dialogConfig);
    } else {
      this.dialog.open(HistoricoCompletoComponent, dialogConfig);
    }
  }

  private filtrarConsultasPorTipo(dados: any[], tipo: TipoVisualizacao): any[] {
    const statusPermitidos = tipo === 'AGENDADA' ? STATUS_AGENDADAS : STATUS_FINALIZADAS;
    return dados.filter((consulta) => statusPermitidos.includes(consulta.status));
  }

  tratarDadosParaTabela(dados: any[]): Tabela[] {
    return dados.map((dado) => ({
      consulta: dado.conCodigoConsulta || dado.conSttCodigoConsulta,
      medico: dado.conMedico || dado.conSttMedico,
      paciente: dado.conPaciente || dado.conSttPaciente,
      diaSemana: dado.conDia_semana || dado.conDiaSemana || dado.conSttDia_semana,
      data: dado.conData || dado.conSttData,
      horario: dado.conHorario || dado.conSttHorario,
      observacao: dado.conObservacoes || dado.conSttObservacao,
      dadaCriacao: dado.conDataCriacao || dado.conSttDataCriacao,
      status: dado.conStatus || dado.conSttStatus,
      adm: dado.conAdm || dado.conSttAdm,
      formaPagamento: dado.conFormaPagamento || dado.conSttFormaPagamento,
    }));
  }

  filtrandoDadosDoBancoPassadoParametros_Pesquisa(
    dados: any, dataSource: Consultav2[]
  ): Promise<Consultav2[]> {
    return new Promise((resolve, reject) => {
      try {
        const normalize = (str: string) =>
          str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

        const safe = (value: any) => (value ? normalize(value.toString()) : '');

        const isDateMatch = (d1: string, d2: string) => {
          const parse = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
          const p1 = parse(d1); const p2 = parse(d2);
          return p1 && p2 ? p1.toISOString().split('T')[0] === p2.toISOString().split('T')[0] : false;
        };

        const isTimeMatch = (t1: string, t2: string) => {
          const fmt = (t: string) => {
            const [h, m] = t.split(':');
            return h && m ? `${h.padStart(2, '0')}:${m.padStart(2, '0')}` : null;
          };
          const f1 = fmt(t1.trim()); const f2 = fmt(t2.trim());
          return f1 && f2 ? f1 === f2 : false;
        };

        const query = safe(dados.trim());
        resolve(dataSource.filter(item =>
          safe(item.id).includes(query) ||
          safe(item.pacienteNome).includes(query) ||
          isDateMatch(item.dataHora, dados.trim()) ||
          isTimeMatch(item.dataHora, dados.trim()) ||
          safe(item.observacoes).includes(query)
        ));
      } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        reject(error);
      }
    });
  }
}
