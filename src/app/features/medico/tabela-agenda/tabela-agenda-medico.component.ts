import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ObservacoesComponent } from 'src/app/features/administrador/gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { Router } from '@angular/router';

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

  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  constructor(
    private tokenService: tokenService,
    private consultaApiService: ConsultaApiService,
    public dialog: MatDialog,
    private prontuarioStateService: ProntuarioStateService,
    private DialogService: DialogService,
    private route: Router
  ) {
    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((Usuario) => {
      if (Usuario) {
        this.UsuarioLogado = Usuario;
      }
    });

    this.BuscarDadosDeAgendaDoMedicoDoDia();


  }

  ngOnInit() { }


  DesejaAbrirConsulta(element: any) {
    Swal.fire({
      title: 'Tem certeza que deseja abrir essa consulta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5ccf6c',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, abrir!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.prontuarioStateService.setConsulta(element);
        this.navegarParaProntuario();
      } else {
        this.BuscarDadosDeAgendaDoMedicoDoDia();
      }
    });
  }



  AbrirConsulta(element: any) {
    this.prontuarioStateService.setConsulta(element);
    this.navegarParaProntuario();
  }

  private navegarParaProntuario(): void {
    if (this.UsuarioLogado.perfil === 'DENTISTA') {
      this.route.navigate(['startconsulta-dentista']);
    } else {
      this.route.navigate(['startconsulta']);
    }
  }






  filtrandoDadosDoBancoPassadoParametros(dados: any) {
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
      this.DialogService.NaoFoiEncontradoConsultasComEssesParametros();
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
      console.log('dados', dados);

      if (!dados || dados.length === 0) {
        Swal.fire('Nenhuma consulta encontrada', 'Tente novamente', 'warning');
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
