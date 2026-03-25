import { ProfissionalApiService } from '../../../../services/api/profissional-api.service';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TabelasPesquisasMedicosComponent } from './tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';
import { TabelaDePacientesComponent } from './tabela-de-pacientes/tabela-de-pacientes.component';
import Swal from 'sweetalert2';
import { HoradaConsulta } from 'src/app/util/variados/options/options';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { AuthApiService } from 'src/app/services/api/auth-api.service';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { async } from 'rxjs';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';
import { CadastroPacienteComponent } from '../../cadastros/cadastro-paciente/cadastro-paciente.component';
const STATUS_AGENDADAS = ['AGENDADA'];

@Component({
  selector: 'app-nova-consulta',
  templateUrl: './nova-consulta.component.html',
  styleUrls: ['./nova-consulta.component.css']
})
export class NovaConsultaComponent implements OnInit {

  FormularioPaciente!: FormGroup
  FormularioMedicos!: FormGroup
  FormularioConsulta!: FormGroup

  Medico: Profissional = {
    codigo: 0,
    nome: '',
    especialidades: '',
    registroConselho: '',
    tempoConsultaMinutos: 0,
    email: '',
    telefone: '',
    sexo: 0,
    dataNacimento: '',
    cpf: '',
    rg: '',
    formacao: '',
    instituicao: '',
    nacionalidade: '',
    uf: '',
    municipio: '',
    bairro: '',
    cep: '',
    rua: '',
    numero: 0,
    complemento: '',
    id: 0,
    valorConsulta: 0

  }
  Paciente: Paciente = {
    codigo: 0,
    nome: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: '',
    status: 0
  }
  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  DiaDaSemana: string = ''
  MostraHora: boolean = false
  Hora = HoradaConsulta;
  horariosDisponiveis: string[] = [];
  DataSelecionada: any;

  constructor(
    private router: Router,
    private FormBuilder: FormBuilder,
    private profissionalApiService: ProfissionalApiService,
    private dialog: MatDialog,
    private pacienteApi: PacienteApiService,
    private consultaApi: ConsultaApiService,
    private consultaState: ConsultaStateService,
    private authApi: AuthApiService,
    private tokenService: tokenService,
    private DialogService: DialogService
  ) {
    this.tokenService.UsuarioLogadoValue$.subscribe((UsuarioLogado) => {
      if (UsuarioLogado) this.UsuarioLogado = UsuarioLogado;
    });
  }

  ngOnInit() {
    this.FormularioMedicos = this.FormBuilder.group({
      PesquisaMedicos: [''],
      OptionsFindMedicos: 5,
    });

    this.FormularioPaciente = this.FormBuilder.group({
      PesquisaPaciente: [''],
      OptionsFindPaciente: 5,
    });

    this.FormularioConsulta = this.FormBuilder.group({
      observacao: [''],
      date: [''],
      Hora: [''],
      Pagamento: [''],
      valor: [null, [Validators.required, Validators.min(0)]], // NOVO CAMPO
    });
  }

  async Pesquisar(value: string) {
    if (value === 'paciente') {
      const FiltroPesquisa = this.FormularioPaciente.get('OptionsFindPaciente')?.value;
      const pesquisa: string = this.FormularioPaciente.get('PesquisaPaciente')?.value;
      try {
        const dados = await this.pacienteApi.pesquisarComFiltro(FiltroPesquisa, pesquisa, 'ATIVO').toPromise();
        this.AbirTabela(dados, 'paciente');
      } catch (error) {
        Swal.fire('Erro', 'Erro ao pesquisar pacientes', 'error');
      }
    }
    if (value === 'medico') {
      const FiltroPesquisa = this.FormularioMedicos.get('OptionsFindMedicos')?.value;
      const pesquisa: string = this.FormularioMedicos.get('PesquisaMedicos')?.value;
      this.FormularioConsulta.patchValue({
        date: '',
        Hora: ''
      });
      try {
        const dados = await this.profissionalApiService.pesquisarComFiltro(FiltroPesquisa, pesquisa, 'ATIVO').toPromise();
        this.AbirTabela(dados, 'medico');
      } catch (error) {
        Swal.fire('Erro', 'Erro ao pesquisar médicos', 'error');
      }
    }
  }

  AbirTabela(Dados: any, value: string) {
    if (value === 'paciente') {
      const dialogRef = this.dialog.open(TabelaDePacientesComponent, {
        width: '800px',
        data: Dados,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.Paciente = result;
        }
      });
    }

    if (value === 'medico') {
      const dialogRef = this.dialog.open(TabelasPesquisasMedicosComponent, {
        width: '800px',
        data: Dados,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.MostraHora = true;
          this.Medico = result;

          // NOVO: Preencher o valor da consulta automaticamente se o médico tiver
          if (this.Medico.valorConsulta) {
            this.FormularioConsulta.patchValue({
              valor: this.Medico.valorConsulta
            });
          }
        }
      });
    }
  }

  onDateChange(event: Event) {
    const selectedDate = this.FormularioConsulta.get('date')?.value
    const date = new Date(selectedDate + 'T00:00:00');
    const utcDate = new Date(date.toUTCString());
    const options = { weekday: 'long' as const };
    const diaDaSemana = new Intl.DateTimeFormat('pt-BR', options).format(utcDate);
    this.DiaDaSemana = diaDaSemana;
    this.DataSelecionada = selectedDate;
    if (this.MostraHora) {
      this.verificarCondicoesParaConsulta(selectedDate)
    }
  }

  verificarCondicoesParaConsulta(selectedDate: Date) {
    this.horariosDisponiveis = [];
    if (this.Medico && selectedDate) {
      if (!this.Medico.tempoConsultaMinutos) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'O médico ainda não informou o tempo de consulta. Portanto, serão utilizados os horários padrão.',
          showCloseButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              text: 'É altamente recomendado que o tempo de consulta seja definido pelo médico para evitar problemas futuros.',
            });
          }
        });
        this.Hora = [...HoradaConsulta];
        return;
      }

      // Busca os horários já ocupados e gera os novos slots respeitando as consultas existentes
      this.consultaApi.buscarHorariosOcupadosByOrg(this.Medico.id!, selectedDate as any).subscribe(
        (data) => {
          this.horariosDisponiveis = data;
          this.generateAvailableTimesRespeitandoOcupados(
            this.Medico.tempoConsultaMinutos!,
            this.horariosDisponiveis
          );
        },
        (error) => {
          console.error('Erro ao buscar horários ocupados:', error);
          this.generateAvailableTimes(this.Medico.tempoConsultaMinutos!);
        }
      );
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
   * @param horariosOcupados Lista de horários ocupados no formato "HH:mm:ss" ou "HH:mm"
   */
  generateAvailableTimesRespeitandoOcupados(novoIntervalo: number, horariosOcupados: string[]) {
    const startTime = this.convertToDateObject('08:00');
    const endTime = this.convertToDateObject('18:00');

    // Se não há horários ocupados, gera normalmente com o novo intervalo
    if (!horariosOcupados || horariosOcupados.length === 0) {
      this.generateAvailableTimes(novoIntervalo);
      return;
    }

    // Converte horários ocupados para objetos Date e ordena
    const ocupados = horariosOcupados
      .map(h => this.convertToDateObject(h.substring(0, 5)))
      .sort((a, b) => a.getTime() - b.getTime());

    // Deduz o intervalo antigo pela diferença entre horários consecutivos
    let intervaloAntigo = novoIntervalo;
    if (ocupados.length >= 2) {
      intervaloAntigo = (ocupados[1].getTime() - ocupados[0].getTime()) / 60000;
    }

    // Monta blocos ocupados e mescla em grupos contíguos
    // Cada grupo contíguo representa uma sequência ininterrupta de consultas
    const gruposOcupados: { inicio: Date; fim: Date }[] = [];
    for (const inicio of ocupados) {
      const fim = new Date(inicio.getTime() + intervaloAntigo * 60000);
      const ultimoGrupo = gruposOcupados[gruposOcupados.length - 1];
      if (ultimoGrupo && inicio.getTime() <= ultimoGrupo.fim.getTime()) {
        // Extende o grupo existente
        ultimoGrupo.fim = fim.getTime() > ultimoGrupo.fim.getTime() ? fim : ultimoGrupo.fim;
      } else {
        gruposOcupados.push({ inicio, fim });
      }
    }

    // Gera os novos slots nos espaços livres entre os grupos ocupados
    this.Hora = [];
    const intervalos: { inicio: Date; fim: Date }[] = [];

    // Espaço antes do primeiro grupo ocupado
    if (gruposOcupados[0].inicio.getTime() > startTime.getTime()) {
      intervalos.push({ inicio: startTime, fim: gruposOcupados[0].inicio });
    }

    // Espaços entre grupos ocupados
    for (let i = 0; i < gruposOcupados.length - 1; i++) {
      intervalos.push({ inicio: gruposOcupados[i].fim, fim: gruposOcupados[i + 1].inicio });
    }

    // Espaço depois do último grupo ocupado
    const ultimoGrupo = gruposOcupados[gruposOcupados.length - 1];
    if (ultimoGrupo.fim.getTime() < endTime.getTime()) {
      intervalos.push({ inicio: ultimoGrupo.fim, fim: endTime });
    }

    // Para cada espaço livre, gera slots com o novo intervalo
    for (const intervalo of intervalos) {
      let currentTime = new Date(intervalo.inicio.getTime());
      while (currentTime.getTime() + novoIntervalo * 60000 <= endTime.getTime()
        && currentTime.getTime() < intervalo.fim.getTime()) {
        this.Hora.push({
          value: this.formatTime(currentTime),
          label: this.formatTime(currentTime),
        });
        currentTime = new Date(currentTime.getTime() + novoIntervalo * 60000);
      }
    }
  }

  generateAvailableTimes(medTempoDeConsulta: number) {
    const startTime = '08:00';
    const endTime = '18:00';

    let currentTime = this.convertToDateObject(startTime);
    const endDateTime = this.convertToDateObject(endTime);
    this.Hora = [];

    while (currentTime <= endDateTime) {
      // Adiciona o horário formatado ao array
      this.Hora.push({
        value: this.formatTime(currentTime),
        label: this.formatTime(currentTime),
      });
      // Incrementa o tempo atual de acordo com o tempo de consulta
      currentTime = new Date(
        currentTime.getTime() + medTempoDeConsulta * 60000
      ); // 60000 ms = 1 minuto
    }
  }

  atualizarHorarios() {
    if (this.horariosDisponiveis) {
      const horariosDisponiveisFormatados = this.horariosDisponiveis.map(
        (horario) => horario.substring(0, 5)
      );

      // Filtra os horários gerados pelo método generateAvailableTimes
      this.Hora = this.Hora.filter((horario) => {
        const horarioFormatado = horario.value.substring(0, 5);
        return !horariosDisponiveisFormatados.includes(horarioFormatado);
      });
    }
  }

  formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  convertToDateObject(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    // Usa uma data fixa (01/01/2000) para evitar problemas com data/hora atual
    const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
    return date;
  }



  //======================================================================

  async marcarConsulta() {
    console.log('Iniciando processo de marcação de consulta...', this.FormularioConsulta);
    const input_Forma_Pagamento = this.transformaFormaPagamento();
    const input_HORA = this.FormularioConsulta.get('Hora')?.value;
    const input_OBSERVACAO = this.FormularioConsulta.get('observacao')?.value;
    const input_VALOR = this.FormularioConsulta.get('valor')?.value; // NOVO
    const dataAtual = new Date().toISOString().split('T')[0];

    console.log('Dados para cadastro da consulta:', {
      input_Forma_Pagamento,
      input_HORA,
      input_OBSERVACAO,
      input_VALOR,
      DataSelecionada: this.DataSelecionada,
      Medico: this.Medico,
      Paciente: this.Paciente
    });


    if (this.Medico && this.Paciente && this.DataSelecionada &&
      input_Forma_Pagamento && input_HORA && input_VALOR !== null) {

      const Especialidade = this.Medico.especialidades as any;
      const consult: any = {
        profissionalId: this.Medico.id,
        pacienteId: this.Paciente.codigo,
        dataHora: this.DataSelecionada + 'T' + input_HORA,
        // CORREÇÃO AQUI: Acessa o primeiro elemento do array especialidades
        especialidadeId: Especialidade?.[0]?.id || null,
        duracaoMinutos: this.Medico.tempoConsultaMinutos || null,
        observacoes: input_OBSERVACAO,
        formaPagamentoId: input_Forma_Pagamento,
        valor: parseFloat(input_VALOR) || 0 // NOVO: Garantir que é número
      };

      try {
        const dados = await this.consultaApi.verificarDisponibilidadeByOrg(
          this.DataSelecionada,
          input_HORA,
          this.Medico.id
        ).toPromise();
        if (dados) {
          this.DialogService.JaexisteDadosCAdastradosComEssesParamentros();
          this.FormularioConsulta.reset();
          return;
        }

        this.consultaApi.cadastrarConsultaByOrg(consult).subscribe((response) => {
          console.log('Resposta da API:', response);
          const texto: string = `O cadastro da consulta foi realizado com sucesso.\nCodigo de consulta: ${response.id} `;
          Swal.fire({
            icon: 'success',
            title: 'OK',
            text: texto,
          }).then((result) => {
            if (result.isConfirmed) {
              this.FormularioPaciente.reset();
              this.FormularioMedicos.reset();

              this.FormularioPaciente.patchValue({
                OptionsFindPaciente: 5
              })

              this.FormularioMedicos.patchValue({
                OptionsFindMedicos: 5
              });

              this.FormularioConsulta.reset();
              this.Paciente = {} as Paciente;
              this.Medico = {} as Profissional;
              this.consultaState.setCadastroRealizado(response);
            }
          });
        },
          (error) => {
            console.error('Erro ao criar consulta:', error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Algo deu errado. Tente novamente mais tarde.',
            });
          }
        );
      } catch (error) {
        console.error('Erro ao verificar consultas:', error);
        this.DialogService.JaexisteDadosCAdastradosComEssesParamentros();
        this.FormularioConsulta.reset();
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Por favor, preencha todos os campos obrigatórios.',
      });
    }
  }







  transformaFormaPagamento() {
    const pagamentoValue = this.FormularioConsulta.get('Pagamento')?.value;
    let FornaPAgamento: number;

    switch (pagamentoValue) {
      case 'Particular':
        return (FornaPAgamento = 1);
        break;
      case 'Convênio':
        return (FornaPAgamento = 2);
        break;
      case 'Cartão de Crédito':
        return (FornaPAgamento = 3);
        break;
      case 'Cartão de Débito':
        return (FornaPAgamento = 4);
        break;
      case 'PIX':
        return (FornaPAgamento = 5);
      case 'Dinheiro':
        return (FornaPAgamento = 6);
      default:
        return (FornaPAgamento = 0); // Valor padrão, caso nenhuma das opções seja selecionada
    }
  }



  getPrimeiraEspecialidade(profissional: any): string {
    if (!profissional.especialidades || profissional.especialidades.length === 0) {
      return 'Não informado';
    }
    return profissional.especialidades[0].nome;
  }

  formatarValor(valor: number): string {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // NOVO MÉTODO: Limpar formulários
  private limparFormularios(): void {
    this.FormularioPaciente.reset();
    this.FormularioMedicos.reset();
    this.FormularioConsulta.reset();

    this.FormularioPaciente.patchValue({
      OptionsFindPaciente: 5
    });

    this.FormularioMedicos.patchValue({
      OptionsFindMedicos: 5
    });

    this.Paciente = {} as Paciente;
    this.Medico = {} as Profissional;
    this.DataSelecionada = null;
    this.MostraHora = false;
  }



  AdicionarPaciente() {
    const dialogRef = this.dialog.open(CadastroPacienteComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
  }









}

