import { ImprimirPrescricaoComponent } from './../impressoes/ImprimirPrescricao/ImprimirPrescricao.component';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { tokenService } from 'src/app/util/Token/Token.service';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { ObservacoesComponent } from 'src/app/features/administrador/gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
import { ImprimirSoliciatacaoDeExamesComponent } from '../impressoes/ImprimirSoliciatacaoDeExames/ImprimirSoliciatacaoDeExames.component';
import { AtestadoPacienteComponent } from '../impressoes/AtestadoPaciente/AtestadoPaciente.component';
import { HistoricoCompletoComponent } from '../impressoes/historicoCompleto/historicoCompleto.component';
import { SelecaoRelatorioComponent } from '../impressoes/selecao-relatorio/selecao-relatorio.component';
import { ImprimirRegistroComponent } from '../impressoes/ImprimirRegistro/ImprimirRegistro.component';
import { Consulta } from 'src/app/util/variados/interfaces/consulta/consulta';

@Component({
  selector: 'app-historicos',
  templateUrl: './historicos.component.html',
  styleUrls: ['./historicos.component.css'],
})
export class HistoricosComponent implements OnInit {
  highValue: number = 5;
  lowValue: number = 0;
  dataSource: Consulta[] = [];
  filteredDataSource: any[] = [];
  clickedRows = new Set<any>();
  pesquisa: string = '';
  displayedColumns: any = [];

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
    private prontuarioApiService: ProntuarioApiService,
    private DialogService: DialogService
  ) { }

//arrumar a busca de registor esta trazendo dados de Agendada
  ngOnInit(): void {
    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((Usuario) => {
      if (Usuario) {
        this.UsuarioLogado = Usuario;
      }
    });
    if (this.UsuarioLogado.aud == '[ROLE_Medico]') {
      this.BuscarAgendaMedica();
      this.displayedColumnsMedico();
    }

    if (this.UsuarioLogado.aud == '[ROLE_ADMIN]') {
      this.BuscarDadosDeComoAdmin();
      this.displayedColumnsAdmin();
    }
  }

  BuscarDadosDeComoAdmin(): void {
    this.consultaApiService.buscarAgendaTodosMedicos().subscribe({
      next: (dados: any[]) => {
        this.dataSource = this.mapearConsultas(dados);
        this.filteredDataSource = [...this.dataSource];
      },
      error: (error) => console.error('Erro ao buscar dados:', error)
    });
  }

  private mapearConsultas(dados: any[]): Consulta[] {
    return dados.map((item: any) => ({
      ConCodigoConsulta: item.conCodigoConsulta,
      ConMedico: item.conMedico,
      ConPaciente: item.conPaciente,
      ConDia_semana: item.conDia_semana || item.conDiaSemana,
      ConHorario: item.conHorario,
      ConData: item.conData,
      ConObservacoes: item.conObservacoes,
      ConDadaCriacao: item.conDataCriacao,
      ConFormaPagamento: item.conFormaPagamento,
      ConStatus: item.conStatus,
      ConAdm: item.conAdm,
    })).sort((a, b) => {
      const dataA = new Date(a.ConData || '').getTime();
      const dataB = new Date(b.ConData || '').getTime();
      return dataA - dataB;
    });
  }




  filtrandoDadosDoBancoPassadoParametros(dados: string): void {
    if (!dados || !dados.trim()) {
      this.dataSource = [...this.filteredDataSource];
      return;
    }

    const termoBusca = dados.trim().toUpperCase();
    this.dataSource = this.filteredDataSource.filter((item: any) => {
      const nomeMedico = item.ConMedico?.medNome?.toUpperCase() || '';
      const nomePaciente = item.ConPaciente?.paciNome?.toUpperCase() || '';
      const diaSemana = item.ConDia_semana?.toUpperCase() || '';
      const observacoes = item.ConObservacoes?.toUpperCase() || '';
      const data = item.ConData || '';
      const horario = item.ConHorario || '';

      return nomeMedico.includes(termoBusca) ||
             nomePaciente.includes(termoBusca) ||
             diaSemana.includes(termoBusca) ||
             observacoes.includes(termoBusca) ||
             data.includes(termoBusca) ||
             horario.includes(termoBusca);
    });

    if (this.dataSource.length === 0) {
      this.DialogService.NaoFoiEncontradoConsultasComEssesParametros();
      this.dataSource = [...this.filteredDataSource];
    }
  }





  LimparTabela() {
    this.dataSource = [];
    this.filteredDataSource = [];
  }

  chamandoPesquisa() {
    this.filtrandoDadosDoBancoPassadoParametros(this.pesquisa);
  }

  BuscarAgendaMedica(): void {
    this.consultaApiService.buscarHistoricoMedico(this.UsuarioLogado.id).subscribe({
      next: (dados: any[]) => {
        this.dataSource = this.mapearConsultas(dados);
        this.filteredDataSource = [...this.dataSource];
      },
      error: (error) => console.error('Erro ao buscar histórico:', error)
    });
  }


  resetarPesquisa() {
    this.pesquisa = '';

    if (this.UsuarioLogado.aud == '[ROLE_Medico]') {
      this.BuscarAgendaMedica();
    }

    if (this.UsuarioLogado.aud == '[ROLE_ADMIN]') {
      this.BuscarDadosDeComoAdmin();
    }
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

  ImprimirPrescricaoComponent(prontuario: any) {
    this.dialog.open(ImprimirPrescricaoComponent, {
      width: '60%',
      height: '90%',
      data: {
        prontuario: prontuario,
        Consulta: prontuario.prontCodigoConsulta,
      },
    });
  }

  ImprimirSolicitacaoDeExames(prontuario: any) {
    this.dialog.open(ImprimirSoliciatacaoDeExamesComponent, {
      width: '60%',
      height: '90%',
      data: {
        prontuario: prontuario,
        Consulta: prontuario.prontCodigoConsulta,
      },
    });
  }

  ImprimirAtestadoPacienteComponent(prontuario: any) {
    this.dialog.open(AtestadoPacienteComponent, {
      width: '60%',
      height: '90%',
      data: { Consulta: prontuario.prontCodigoConsulta },
    });
  }

  ImprimirHistorioCompleto(prontuario: any) {
    this.dialog.open(HistoricoCompletoComponent, {
      width: '60%',
      height: '90%',
      data: { Consulta: prontuario.prontCodigoConsulta },
    });
  }

  ImprimirRegistro(prontuario: any) {
    this.dialog.open(ImprimirRegistroComponent, {
      width: '60%',
      height: '90%',
      data: {
        prontuario: prontuario,
        Consulta: prontuario.prontCodigoConsulta,
      },
    });
  }



  openImprimirDialog(value: any) {
    this.prontuarioApiService.buscarPorConsultaStatus(value).subscribe((dados: any) => {
      const dialogRef = this.dialog.open(SelecaoRelatorioComponent, {
        width: '650px',
        maxWidth: '95vw',
        panelClass: 'selecao-relatorio-dialog',
        data: { consulta: dados }
      });

      dialogRef.afterClosed().subscribe((opcaoSelecionada: string) => {
        if (opcaoSelecionada) {
          switch (opcaoSelecionada) {
            case '1':
              this.ImprimirSolicitacaoDeExames(dados);
              break;
            case '2':
              this.ImprimirPrescricaoComponent(dados);
              break;
            case '3':
              this.ImprimirHistorioCompleto(dados);
              break;
            case '4':
              this.ImprimirAtestadoPacienteComponent(dados);
              break;
            case '5':
              this.ImprimirRegistro(dados);
              break;
          }
        }
      });
    });
  }



  getPaginatorData(event: PageEvent): PageEvent {
    this.lowValue = event.pageIndex * event.pageSize;
    this.highValue = this.lowValue + event.pageSize;
    this.highValue = Math.min(this.highValue, this.filteredDataSource.length);
    return event;
  }


  displayedColumnsAdmin() {
    this.displayedColumns = [
      'ConCodigoConsulta',
      'NomeMedico',
      'NomePaciente',
      'ConDia_semana',
      'ConData',
      'ConHorario',
      'ConObservacoes',
      'Imprimir',
    ];
  }
  displayedColumnsMedico() {
    this.displayedColumns = [
      'ConCodigoConsulta',
      'NomePaciente',
      'ConDia_semana',
      'ConData',
      'ConHorario',
      'ConObservacoes',
      'Imprimir',
    ];
  }
}
