import { ProntuarioDentistaApiService } from './../../../services/api/prontuario-dentista-api.service';
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
import { CronologiaComponent } from 'src/app/util/variados/Cronologia/cronologia.component';
import { ObservacoesComponent } from 'src/app/features/administrador/gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
 
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
 import { EditarProntuarioDentistaComponent } from '../prontuario-dentista/editar-prontuario-dentista/editar-prontuario-dentista.component';
import { EditarProntuarioMedicoComponent } from '../prontuario-medico/editar-prontuario-medico/editar-prontuario-medico.component';
import { Subject, takeUntil } from 'rxjs';
import { RelatorioService } from 'src/app/features/relatorio/relatorio.service';
 
type TipoVisualizacao = 'CONFIRMADA' | 'REALIZADA';
type TipoPeriodo = 'diario' | 'semanal' | 'mensal' | 'anual';

const STATUS_AGENDADAS = ['CONFIRMADA'];
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
    private tokenService: tokenService,
    private relatorioService: RelatorioService
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
        console.log('Dados brutos recebidos do backend:', dados);
        const tipoVisualizacao: TipoVisualizacao = this.Finalizadas ? 'REALIZADA' : 'CONFIRMADA';
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
    this.dialog.open(CronologiaComponent, {
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Impressões — delegadas ao RelatorioService centralizado
  // ─────────────────────────────────────────────────────────────────────────────
  AbrirOpcoesImpressao(element: Consultav2) {
    this.relatorioService.abrirRelatorioProfissional(element, this.UsuarioLogado.perfil || '');
  }

  /**
   * Abre o dialog de edição do prontuário (médico ou odontológico).
   * @param element Consulta selecionada (finalizada)
   */
  EditarProntuario(element: Consultav2): void {
    // Escolher o componente correto baseado no perfil do usuário
    if (this.UsuarioLogado.perfil === 'DENTISTA') {
      const dialogRef = this.dialog.open(EditarProntuarioDentistaComponent, {
        width: '90%',
        maxWidth: '1200px',
        height: '90%',
        panelClass: 'editar-prontuario-dialog',
        data: { consulta: element },
      });

      dialogRef.afterClosed().subscribe((atualizado: boolean) => {
        if (atualizado) {
          this.buscarDadosParaTabela();
        }
      });
    } else {
      const dialogRef = this.dialog.open(EditarProntuarioMedicoComponent, {
        width: '90%',
        maxWidth: '1200px',
        height: '90%',
        panelClass: 'editar-prontuario-dialog',
        data: { consulta: element },
      });

      dialogRef.afterClosed().subscribe((atualizado: boolean) => {
        if (atualizado) {
          this.buscarDadosParaTabela();
        }
      });
    }
  }

  private filtrarConsultasPorTipo(dados: any[], tipo: TipoVisualizacao): any[] {
    const statusPermitidos = tipo === 'CONFIRMADA' ? STATUS_AGENDADAS : STATUS_FINALIZADAS;
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
