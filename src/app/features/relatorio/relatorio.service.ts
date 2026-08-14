import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';

import { Consultav2, StatusConsulta } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { ConsultaRelatorio, PacienteAtendido, TipoDocumento } from 'src/app/util/variados/interfaces/relatorio/relatorio-paciente';

import { RelatorioComponent } from './relatorio.component';

// Componente comum — Histórico Completo (médico + dentista combinados)
import { HistoricoCompletoComponent } from './impressoes-comuns/historico-completo/historico-completo.component';

// Impressões Médico
import { AtestadoMedicoComponent } from './impressoes-medico/atestado-medico/AtestadoMedico.component';
import { ComprovantePagamentoMedicoComponent } from './impressoes-medico/comprovante-pagamento-medico/comprovante-pagamento-medico.component';
import { ExamesMedicosComponent } from './impressoes-medico/exames-medicos/exames-medicos.component';
import { PlanejamentoMedicoComponent } from './impressoes-medico/planejamento-medico/planejamento-medico.component';
import { PrescricaoMedicoComponent } from './impressoes-medico/prescricao-medico/prescricao-medico.component';
import { QuestionarioSaudeMedicoComponent } from './impressoes-medico/questionario-saude-medico/questionario-saude-medico.component';
import { RegistroConsulataMedicoComponent } from './impressoes-medico/registro-consulta-medico/registro-consulta-medico.component';

// Impressões Dentista
import { AtestadoDentistaComponent } from './impressoes-dentista/atestado-dentista/atestado-dentista.component';
import { ComprovantePagamentoDentistaComponent } from './impressoes-dentista/comprovante-pagamento-dentista/comprovante-pagamento-dentista.component';
import { ExamesDentistaComponent } from './impressoes-dentista/exames-dentista/exames-dentista.component';
import { PlanejamentoDentistaComponent } from './impressoes-dentista/planejamento-dentista/planejamento-dentista.component';
import { PrescricaoDentistaComponent } from './impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { QuestionarioSaudeDentistaComponent } from './impressoes-dentista/questionario-saude-dentista/questionario-saude-dentista.component';
import { RegistroConsultaDentistaComponent } from './impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';

/**
 * Contexto vindo da tela de relatórios por paciente.
 * Usado pelos documentos que não dependem de prontuário para montar o cabeçalho.
 */
export interface ContextoRelatorio {
  paciente?: PacienteAtendido | null;
  consulta?: ConsultaRelatorio | null;
}

/**
 * Serviço centralizado de relatórios.
 * Concentra toda a lógica de negócio para abertura de impressões,
 * detecção de tipo de profissional e busca de prontuários.
 *
 * Pode ser chamado tanto pelo módulo administrador quanto pelo módulo médico.
 */
@Injectable({ providedIn: 'root' })
export class RelatorioService {

  private readonly DIALOG_WIDTH = '60%';
  private readonly DIALOG_HEIGHT = '90%';

  constructor(
    private dialog: MatDialog,
    private prontuarioApiService: ProntuarioApiService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Fluxo principal — Administrador (AdminOrg)
  //
  // O AdminOrg pode visualizar relatórios de qualquer registro.
  // O tipo do profissional (MEDICO/DENTISTA) é detectado automaticamente
  // pela consulta. Se o prontuário médico não for encontrado (404),
  // faz fallback para o prontuário dentista.
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Abre o seletor de relatório no contexto do administrador.
   * Detecta o tipo de profissional pela consulta e abre o dialog correto.
   * @param element - Dados da consulta (Consultav2)
   */
  abrirRelatorioAdmin(element: Consultav2): void {
    const tipoProfissional = this.detectarTipoProfissional(element);

    const dialogRef = this.dialog.open(RelatorioComponent, {
      maxWidth: 'auto',
      panelClass: 'selecao-relatorio-dialog',
      data: {
        consulta: element,
        isAdmin: true,
        tipoProfissional: tipoProfissional,
      },
    });

    dialogRef.afterClosed().subscribe((opcao: string) => {
      if (!opcao) { return; }

      if (opcao === '3') {
        this.abrirHistoricoCompleto(element);
        return;
      }

      if (opcao === '7') {
        this.gerarComprovantePagamento(element);
        return;
      }

      // Tenta prontuário médico; em caso de erro usa o odontológico
      this.prontuarioApiService.buscarProntuarioById(element.id).subscribe(
        (dados) => this.abrirDialogImpressaoMedico(opcao, dados),
        () => this.prontuarioDentistaApiService.buscarProntuarioDentistaById(element.id).subscribe(
          (dados) => this.abrirDialogImpressaoDentista(opcao, dados),
          () => this.mostrarErroProntuarioNaoEncontrado()
        )
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Fluxo principal — Profissional (Médico/Dentista)
  //
  // O profissional vê apenas seus próprios relatórios.
  // O tipo é determinado pelo perfil do usuário logado.
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Abre o seletor de relatório no contexto do profissional.
   * @param element - Dados da consulta (Consultav2)
   * @param perfilUsuario - Perfil do usuário logado ('MEDICO' ou 'DENTISTA')
   */
  abrirRelatorioProfissional(element: Consultav2, perfilUsuario: string): void {
    const consultaNaoRealizada = (element.status as any) === 'AGENDADA';
    const dialogRef = this.dialog.open(RelatorioComponent, {
      maxWidth: 'auto',
      panelClass: 'selecao-relatorio-dialog',
      data: {
        consulta: element,
        consultaNaoRealizada,
        isAdmin: false,
        isProfissional: true,
        tipoProfissional: perfilUsuario,
      },
    });

    dialogRef.afterClosed().subscribe((opcaoSelecionada: string) => {
      if (!opcaoSelecionada) { return; }

      // Histórico Completo não precisa de prontuário
      if (opcaoSelecionada === '3') {
        this.abrirHistoricoCompleto(element);
        return;
      }

      if (perfilUsuario === 'MEDICO') {
        this.prontuarioApiService.buscarProntuarioById(element.id).subscribe(
          (dados: Prontuario) => this.abrirDialogImpressaoMedico(opcaoSelecionada, dados),
          () => this.mostrarErroProntuarioNaoEncontrado()
        );
      } else if (perfilUsuario === 'DENTISTA') {
        this.prontuarioDentistaApiService.buscarProntuarioDentistaById(element.id).subscribe(
          (dados: Prontuario) => this.abrirDialogImpressaoDentista(opcaoSelecionada, dados),
          () => this.mostrarErroProntuarioNaoEncontrado()
        );
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Fluxo direto — Tela de relatórios por paciente
  //
  // Nessa tela o usuário já escolheu o documento no card, então o seletor
  // (RelatorioComponent) é dispensado: o dialog de impressão é aberto direto.
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Abre a impressão de um documento específico de uma consulta.
   * Tenta o prontuário médico e faz fallback para o odontológico,
   * seguindo o mesmo comportamento do fluxo do administrador.
   *
   * O questionário de saúde é assinado pelo paciente antes do atendimento e
   * existe de forma independente do prontuário, portanto é aberto direto com
   * os dados do próprio relatório.
   *
   * @param consultaId - Consulta que originou o documento
   * @param tipo - Tipo do documento selecionado no card
   * @param contexto - Paciente e consulta do relatório, usados pelos documentos que não dependem de prontuário
   */
  abrirDocumentoDaConsulta(consultaId: number, tipo: TipoDocumento, contexto?: ContextoRelatorio): void {
    if (tipo === 'QUESTIONARIO_SAUDE') {
      this.abrirQuestionarioSaude(consultaId, contexto);
      return;
    }

    this.prontuarioApiService.buscarProntuarioById(consultaId).subscribe(
      (dados: Prontuario) => this.abrirDialogImpressaoMedico(this.mapearTipoParaOpcao(tipo, 'MEDICO'), dados),
      () => this.prontuarioDentistaApiService.buscarProntuarioDentistaById(consultaId).subscribe(
        (dados: Prontuario) => this.abrirDialogImpressaoDentista(this.mapearTipoParaOpcao(tipo, 'DENTISTA'), dados),
        () => this.mostrarErroProntuarioNaoEncontrado()
      )
    );
  }

  /**
   * Abre a impressão do questionário de saúde sem exigir prontuário.
   * O componente de impressão busca as respostas pelo id da consulta.
   *
   * @param consultaId - Consulta vinculada ao questionário
   * @param contexto - Paciente e consulta usados no cabeçalho do documento
   */
  private abrirQuestionarioSaude(consultaId: number, contexto?: ContextoRelatorio): void {
    const ehDentista = contexto?.consulta?.tipoProfissionalNome?.toUpperCase() === 'DENTISTA';
    const componente: ComponentType<unknown> = ehDentista
      ? QuestionarioSaudeDentistaComponent
      : QuestionarioSaudeMedicoComponent;

    this.dialog.open(componente, {
      width: this.DIALOG_WIDTH,
      height: this.DIALOG_HEIGHT,
      data: this.montarDadosQuestionario(consultaId, contexto),
    });
  }

  /**
   * Monta o objeto esperado pelos componentes de questionário a partir do relatório.
   *
   * @param consultaId - Consulta vinculada ao questionário
   * @param contexto - Paciente e consulta do relatório
   * @returns Estrutura compatível com o formato de prontuário usado nas impressões
   */
  private montarDadosQuestionario(consultaId: number, contexto?: ContextoRelatorio): any {
    return {
      consultaId,
      profissional: {
        nome: contexto?.consulta?.profissionalNome ?? '',
        conselho: '',
      },
      consulta: {
        id: consultaId,
        dataHora: contexto?.consulta?.dataHora ?? '',
        pacienteNome: contexto?.paciente?.nome ?? '',
        paciente: contexto?.paciente
          ? {
              id: contexto.paciente.id,
              nome: contexto.paciente.nome,
              cpf: contexto.paciente.cpf ?? '',
            }
          : null,
      },
    };
  }

  /**
   * Abre o histórico completo a partir do paciente, sem depender de uma consulta.
   * O HistoricoCompletoComponent utiliza apenas o pacienteId.
   * @param pacienteId - Paciente cujo histórico será exibido
   */
  abrirHistoricoCompletoDoPaciente(pacienteId: number): void {
    this.abrirHistoricoCompleto({ pacienteId } as Consultav2);
  }

  /**
   * Converte o tipo de documento do relatório na opção usada pelos dialogs.
   * O planejamento terapêutico possui códigos distintos por tipo de profissional.
   * @param tipo - Tipo do documento
   * @param tipoProfissional - 'MEDICO' ou 'DENTISTA'
   * @returns Código da opção de impressão
   */
  private mapearTipoParaOpcao(tipo: TipoDocumento, tipoProfissional: 'MEDICO' | 'DENTISTA'): string {
    const mapa: Partial<Record<TipoDocumento, string>> = {
      EXAMES: '1',
      PRESCRICAO: '2',
      ATESTADO: '4',
      REGISTRO_CONSULTA: '5',
      COMPROVANTE_PAGAMENTO: '6',
      QUESTIONARIO_SAUDE: '8',
      PLANEJAMENTO: tipoProfissional === 'DENTISTA' ? '9' : '10',
    };
    return mapa[tipo] ?? '5';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Mapeamento de opções → componentes
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Abre o dialog de impressão correto para prontuário médico.
   * @param opcao - ID da opção selecionada no seletor de relatório
   * @param dados - Dados do prontuário médico
   */
  private abrirDialogImpressaoMedico(opcao: string, dados: Prontuario): void {
    const dialogConfig = { width: this.DIALOG_WIDTH, height: this.DIALOG_HEIGHT, data: dados };
    const acoes: Record<string, () => void> = {
      '1': () => this.dialog.open(ExamesMedicosComponent, dialogConfig),
      '2': () => this.dialog.open(PrescricaoMedicoComponent, dialogConfig),
      '4': () => this.dialog.open(AtestadoMedicoComponent, dialogConfig),
      '5': () => this.dialog.open(RegistroConsulataMedicoComponent, dialogConfig),
      '6': () => this.dialog.open(ComprovantePagamentoMedicoComponent, dialogConfig),
      '7': () => this.gerarComprovantePagamentoFromProntuario(dados),
      '8': () => this.dialog.open(QuestionarioSaudeMedicoComponent, dialogConfig),
      '10': () => this.dialog.open(PlanejamentoMedicoComponent, dialogConfig),
    };
    acoes[opcao]?.();
  }

  /**
   * Abre o dialog de impressão correto para prontuário dentista.
   * @param opcao - ID da opção selecionada no seletor de relatório
   * @param dados - Dados do prontuário odontológico
   */
  private abrirDialogImpressaoDentista(opcao: string, dados: Prontuario): void {
    const dialogConfig = { width: this.DIALOG_WIDTH, height: this.DIALOG_HEIGHT, data: dados };
    const acoes: Record<string, () => void> = {
      '1': () => this.dialog.open(ExamesDentistaComponent, dialogConfig),
      '2': () => this.dialog.open(PrescricaoDentistaComponent, dialogConfig),
      '4': () => this.dialog.open(AtestadoDentistaComponent, dialogConfig),
      '5': () => this.dialog.open(RegistroConsultaDentistaComponent, dialogConfig),
      '6': () => this.dialog.open(ComprovantePagamentoDentistaComponent, dialogConfig),
      '8': () => this.dialog.open(QuestionarioSaudeDentistaComponent, dialogConfig),
      '9': () => this.dialog.open(PlanejamentoDentistaComponent, dialogConfig),
    };
    acoes[opcao]?.();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Histórico Completo
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Abre o histórico completo do paciente (médico + odontológico).
   * O backend aplica as regras de acesso conforme o token JWT do usuário logado:
   * - Administrador: histórico combinado de todos os profissionais.
   * - Profissional (médico/dentista): apenas os registros dos quais ele é o autor.
   * @param dados - Dados da consulta (fornece o pacienteId)
   */
  private abrirHistoricoCompleto(dados: Consultav2): void {
    this.dialog.open(HistoricoCompletoComponent, {
      width: this.DIALOG_WIDTH,
      height: this.DIALOG_HEIGHT,
      data: dados,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Comprovante de Pagamento
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Gera comprovante de pagamento.
   * Tenta buscar prontuário médico, se falhar tenta dentista.
   * @param element - Dados da consulta
   */
  gerarComprovantePagamento(element: Consultav2): void {
    const dialogConfig = { width: this.DIALOG_WIDTH, height: this.DIALOG_HEIGHT };
    this.prontuarioApiService.buscarProntuarioById(element.id).subscribe(
      (dados) => this.dialog.open(ComprovantePagamentoDentistaComponent, { ...dialogConfig, data: dados }),
      () => this.prontuarioDentistaApiService.buscarProntuarioDentistaById(element.id).subscribe(
        (dados) => this.dialog.open(ComprovantePagamentoDentistaComponent, { ...dialogConfig, data: dados }),
        () => this.mostrarErroProntuarioNaoEncontrado()
      )
    );
  }

  /**
   * Gera comprovante de pagamento a partir de dados do prontuário.
   * @param dados - Dados do prontuário
   */
  private gerarComprovantePagamentoFromProntuario(dados: Prontuario): void {
    const consultaData: Consultav2 = {
      id: dados.consulta?.id || 0,
      profissionalId: dados.profissional?.id || 0,
      profissionalNome: dados.profissional?.nome || '',
      profissionalConselho: dados.profissional?.conselho || '',
      tipoProfissionalId: dados.profissional?.tipoProfissionalId ?? null,
      tipoProfissionalNome: dados.profissional?.tipoProfissionalNome ?? null,
      pacienteId: dados.consulta?.paciente?.id || 0,
      pacienteNome: dados.consulta?.paciente?.nome || dados.consulta?.pacienteNome || '',
      pacienteTelefone: dados.consulta?.paciente?.telefone || null,
      especialidadeId: 0,
      especialidadeNome: '',
      dataHora: dados.consulta?.dataHora || '',
      dataHoraFim: '',
      duracaoMinutos: 0,
      status: (dados.consulta?.status as StatusConsulta) || StatusConsulta.REALIZADA,
      observacoes: dados.consulta?.observacoes || null,
      formaPagamentoId: 0,
      formaPagamentoNome: dados.consulta?.formaPagamentoNome || '',
      valor: dados.consulta?.valor || 0,
      canceladoPor: null,
      motivoCancelamento: null,
      createdAt: '',
    };
    this.gerarComprovantePagamento(consultaData);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilitários
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Detecta o tipo de profissional (MEDICO ou DENTISTA) com base na consulta.
   * Utiliza o campo tipoProfissionalNome retornado pela API.
   * @param consulta - Dados da consulta
   * @returns 'MEDICO' ou 'DENTISTA'
   */
  detectarTipoProfissional(consulta: Consultav2): string {
    return consulta.tipoProfissionalNome?.toUpperCase() === 'DENTISTA'
      ? 'DENTISTA'
      : 'MEDICO';
  }

  /**
   * Exibe mensagem de erro quando o prontuário não é encontrado.
   */
  mostrarErroProntuarioNaoEncontrado(): void {
    Swal.fire({
      title: 'Prontuário não encontrado',
      html: `
        <p>Não foi possível encontrar o prontuário desta consulta.</p>
        <p style="color:#666;font-size:14px;margin-top:10px;">
          Verifique se a consulta foi realizada e se o prontuário foi preenchido corretamente.
        </p>
      `,
      icon: 'warning',
      confirmButtonColor: '#0066CC',
      confirmButtonText: 'Entendi',
    });
  }
}
