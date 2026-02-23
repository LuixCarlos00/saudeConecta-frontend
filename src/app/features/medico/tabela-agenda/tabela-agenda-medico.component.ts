import { Consulta } from 'src/app/util/variados/interfaces/consulta/consulta';
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
import { elements } from 'chart.js';
import { el } from 'date-fns/locale';
import { GerenciamentoComponent } from 'src/app/features/administrador/gerenciamento-agenda/gerenciamento.component';
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
  dataSource: Consulta[] = [];
  filteredDataSource: any[] = [];
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
        //TODO veridicar se e dentista ou medico e manda para a rota correta
        this.route.navigate(['startconsulta']);
        this.prontuarioStateService.setConsulta(element);
      } else {
        this.BuscarDadosDeAgendaDoMedicoDoDia();
      }
    });
  }



  AbrirConsulta(element: any) {
    this.route.navigate(['startconsulta']);
    this.prontuarioStateService.setConsulta(element);
  }






  filtrandoDadosDoBancoPassadoParametros(dados: any) {
    // Função para normalizar e remover acentos e caracteres especiais
    const normalizeString = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .toUpperCase(); // Converte para maiúsculas
    };

    const safeNormalize = (value: any) => {
      return value ? normalizeString(value.toString()) : ''; // Verifica se o valor não é nulo ou undefined
    };

    const isDateMatch = (date1: string, date2: string) => {
      const parseDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      const parsedDate1 = parseDate(date1);
      const parsedDate2 = parseDate(date2);

      if (!parsedDate1 || !parsedDate2) {
        return false; // Se qualquer data for inválida, retorne false
      }

      return parsedDate1.toISOString().split('T')[0] === parsedDate2.toISOString().split('T')[0];
    };


    const isTimeMatch = (time1: string, time2: string) => {
      const formatTime = (time: string) => {
        let [hour, minute] = time.split(':');
        if (!hour || !minute) {
          return null; // Se não for possível dividir corretamente, retorne null
        }
        hour = hour.padStart(2, '0'); // Garante que a hora tenha 2 dígitos
        minute = minute.padStart(2, '0'); // Garante que os minutos tenham 2 dígitos
        return `${hour}:${minute}`;
      };

      const formattedTime1 = formatTime(time1.trim());
      const formattedTime2 = formatTime(time2.trim());

      if (!formattedTime1 || !formattedTime2) {
        return false; // Se qualquer hora for inválida, retorne false
      }

      return formattedTime1 === formattedTime2;
    };


    const dadosUpper = safeNormalize(dados.trim());

    // Filtrar os dados da consulta, comparando as strings normalizadas e tratando a data e o horário de forma específica
    let resultadoFiltrado = this.filteredDataSource.filter(
      (item) =>
        safeNormalize(item.ConCodigoConsulta).includes(dadosUpper) ||
        safeNormalize(item.ConMedico?.medNome).includes(dadosUpper) || // Verifica se ConMedico existe antes de acessar medNome
        safeNormalize(item.ConPaciente?.paciNome).includes(dadosUpper) || // Verifica se ConPaciente existe antes de acessar paciNome
        safeNormalize(item.ConDia_semana).includes(dadosUpper) ||
        isDateMatch(item.ConData, dados.trim()) || // Compara as datas sem normalizar
        isTimeMatch(item.ConHorario, dados.trim()) || // Compara os horários diretamente
        safeNormalize(item.ConObservacoes).includes(dadosUpper)
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

      let novaConsulta: Consulta[] = [];
      for (let i = 0; i < dados.length; i++) {
        novaConsulta[i] = {
          ConCodigoConsulta: dados[i].conCodigoConsulta,
          ConMedico: dados[i].conMedico,
          ConPaciente: dados[i].conPaciente,
          ConDia_semana: dados[i].conDiaSemana,
          ConHorario: dados[i].conHorario,
          ConData: dados[i].conData,
          ConObservacoes: dados[i].conObservacoes,
          ConDadaCriacao: dados[i].conDataCriacao,
          ConFormaPagamento: dados[i].conFormaPagamento,
          ConStatus: dados[i].conStatus,
          ConAdm: dados[i].conAdm,
        };
      }

      // Ordenar a novaConsulta pela data e depois pelo horário
      novaConsulta.sort((a, b) => {
        const dataA = new Date(a.ConData).getTime();
        const dataB = new Date(b.ConData).getTime();

        if (dataA !== dataB) {
          return dataA - dataB; // Ordena por data
        } else {
          const horaA = a.ConHorario.split(':').map(Number);
          const horaB = b.ConHorario.split(':').map(Number);

          // Ordenar por horário se as datas forem iguais
          if (horaA[0] !== horaB[0]) {
            return horaA[0] - horaB[0];
          }
          return horaA[1] - horaB[1];
        }
      });

      if (novaConsulta.length > 0) {
        this.dataSource = novaConsulta;
        this.filteredDataSource = novaConsulta; // Inicializa o filtro
      } else {
        Swal.fire('Nenhuma consulta encontrada', 'Tente novamente', 'warning');
        novaConsulta[0] = {
          ConCodigoConsulta: 0,
          ConMedico: 0,
          ConPaciente: 0,
          ConDia_semana: 'Sem Dados',
          ConHorario: 'Sem Dados',
          ConData: 'Sem Dados',
          ConObservacoes: 'Sem Dados',
          ConDadaCriacao: 'Sem Dados',
          ConFormaPagamento: 0,
          ConStatus: '',
          ConAdm: 0,
        };
        this.dataSource = novaConsulta;
        this.filteredDataSource = novaConsulta; // Inicializa o filtro
      }
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
    'ConCodigoConsulta',
    'NomePaciente',
    'ConDia_semana',
    'ConData',
    'ConHorario',
    'ConObservacoes',
    'Consulta',
  ];
}
