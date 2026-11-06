import { filter, take } from 'rxjs';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { RascunhoAtendimentoApiService } from 'src/app/core/data-access/rascunho-atendimento-api.service';
import { ProntuarioStateService } from 'src/app/core/data-access/prontuario-state.service';
import { Usuario } from 'src/app/shared/models/usuario';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { ObservacoesComponent } from 'src/app/features/agenda/components/agenda/Observacoes/Observacoes.component';
import { Router } from '@angular/router';
import { formatarDataLocal } from 'src/app/shared/utils/data-local';

@Component({
  selector: 'app-tabela-agenda-medico',
  templateUrl: './tabela-agenda-medico.component.html',
  styleUrls: ['./tabela-agenda-medico.component.css'],
})
export class TabelaAgendaMedicoComponent implements OnInit {

  @Output() selecionaMedico = new EventEmitter<any>();
  @Output() fechar = new EventEmitter<void>();
  highValue: number = 5;
  lowValue: number = 0;
  dataSource: Consultav2[] = [];
  filteredDataSource: Consultav2[] = [];
  clickedRows = new Set<any>();
  pesquisa: string = '';
  /** IDs das consultas que já têm rascunho de atendimento (uma chamada por carregamento da tela). */
  consultasComRascunho = new Set<number>();

  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  constructor(
    private notificacao: NotificacaoService,
    private authService: AuthService,
    private consultaApiService: ConsultaApiService,
    public dialog: MatDialog,
    private prontuarioStateService: ProntuarioStateService,
    private route: Router,
    private rascunhoApi: RascunhoAtendimentoApiService
  ) {
    this.authService.currentUser$.pipe(filter(Boolean), take(1)).subscribe((Usuario) => {
      if (Usuario) {
        this.UsuarioLogado = Usuario;
      }
    });

    this.BuscarDadosDeAgendaDoMedicoDoDia();


  }

  ngOnInit() {
    this.carregarRascunhos();
  }

  /** Busca de uma vez os rascunhos do profissional logado para trocar "Iniciar" por "Retomar atendimento". */
  private carregarRascunhos(): void {
    this.rascunhoApi.listarMeus().subscribe({
      next: lista => { this.consultasComRascunho = new Set((lista || []).map(r => r.consultaId)); },
      // Sem a lista a agenda continua funcionando: só mostra "Iniciar" em todas.
      error: () => { this.consultasComRascunho = new Set<number>(); },
    });
  }

  /** A consulta já tem um atendimento em andamento (rascunho salvo)? */
  temRascunho(consulta: Consultav2): boolean {
    return !!consulta && this.consultasComRascunho.has(consulta.id);
  }


  DesejaAbrirConsulta(element: any) {
    this.notificacao.fire({
      title: 'Tem certeza que deseja abrir essa consulta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5ccf6c',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, abrir!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.prontuarioStateService.setConsulta(element);
        this.navegarParaProntuario(element.id);
      } else {
        this.BuscarDadosDeAgendaDoMedicoDoDia();
      }
    });
  }



  AbrirConsulta(element: any) {
    this.prontuarioStateService.setConsulta(element);
    this.navegarParaProntuario(element.id);
  }

  private navegarParaProntuario(consultaId: number): void {
    if (this.UsuarioLogado.tipoProfissional === 'DENTISTA') {
      this.route.navigate(['startconsulta-dentista', consultaId]);
    } else {
      this.route.navigate(['startconsulta', consultaId]);
    }
  }






  filtrandoDadosDoBancoPassadoParametros(dados: any) {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    const safe = (value: any) => (value ? normalize(value.toString()) : '');

    const isDateMatch = (d1: string, d2: string) => {
      const parse = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
      const p1 = parse(d1); const p2 = parse(d2);
      return p1 && p2 ? formatarDataLocal(p1) === formatarDataLocal(p2) : false;
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

    let resultadoFiltrado = this.filteredDataSource.filter(
      (item) =>
        safe(item.id).includes(query) ||
        safe(item.pacienteNome).includes(query) ||
        safe(item.profissionalNome).includes(query) ||
        isDateMatch(item.dataHora, dados.trim()) ||
        isTimeMatch(item.dataHora, dados.trim()) ||
        safe(item.observacoes).includes(query)
    );

    if (resultadoFiltrado.length > 0) {
      this.LimparTabela();
      this.dataSource = resultadoFiltrado;
    } else {
      this.notificacao.mostrarSnackbar('Não foi encontrado consultas com esses parametros .Tente Novamente.', 50000);
      this.LimparTabela();
      this.BuscarDadosDeAgendaDoMedicoDoDia();
    }
  }
















  LimparTabela() {
    this.dataSource = [];
    this.filteredDataSource = [];
  }

  chamandoPesquisa() {
    this.filtrandoDadosDoBancoPassadoParametros(this.pesquisa);
  }

  //
  // todos os dados e organiza pelo dia  e mostra apenas os que sao do dia de hoje

  BuscarDadosDeAgendaDoMedicoDoDia() {
    this.consultaApiService.buscarAgendaMedico(this.UsuarioLogado.id).subscribe((dados) => {

      if (!dados || dados.length === 0) {
        this.notificacao.fire('Nenhuma consulta encontrada', 'Tente novamente', 'warning');
        this.dataSource = [];
        this.filteredDataSource = [];
        return;
      }

      // Ordenar pela dataHora
      const consultasOrdenadas = [...dados].sort((a, b) => {
        return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
      }) as Consultav2[];

      this.dataSource = consultasOrdenadas;
      this.filteredDataSource = consultasOrdenadas;
    });
  }


  resetarPesquisa() {
    this.pesquisa = '';
    this.BuscarDadosDeAgendaDoMedicoDoDia();
  }

  limparPesquisa() {
    this.resetarPesquisa();
    this.pesquisa = '';
  }

  openObservacoesDialog(observacoes: string): void {
    this.dialog.open(ObservacoesComponent, {
      width: '550px',
      data: { observacoes: observacoes },
    });

  }

  getPaginatorData(event: PageEvent): PageEvent {
    this.lowValue = event.pageIndex * event.pageSize;
    this.highValue = this.lowValue + event.pageSize;
    this.highValue = Math.min(this.highValue, this.filteredDataSource.length);
    return event;
  }

  displayedColumns = [
    'id',
    'pacienteNome',
    'dataHora',
    'horario',
    'observacoes',
    'Consulta',
  ];
}
