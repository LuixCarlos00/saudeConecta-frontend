import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';

import { Consultav2, StatusConsulta } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';

import { RelatorioComponent } from './relatorio.component';

// Impressões Médico
import { AtestadoMedicoComponent } from './impressoes-medico/atestado-medico/AtestadoMedico.component';
import { ComprovantePagamentoMedicoComponent } from './impressoes-medico/comprovante-pagamento-medico/comprovante-pagamento-medico.component';
import { ExamesMedicosComponent } from './impressoes-medico/exames-medicos/exames-medicos.component';
import { HistoricoCompletoMedicoComponent } from './impressoes-medico/historico-completo-medico/historico-completo-medico.component';
import { PlanejamentoMedicoComponent } from './impressoes-medico/planejamento-medico/planejamento-medico.component';
import { PrescricaoMedicoComponent } from './impressoes-medico/prescricao-medico/prescricao-medico.component';
import { QuestionarioSaudeMedicoComponent } from './impressoes-medico/questionario-saude-medico/questionario-saude-medico.component';
import { RegistroConsulataMedicoComponent } from './impressoes-medico/registro-consulta-medico/registro-consulta-medico.component';

// Impressões Dentista
import { AtestadoDentistaComponent } from './impressoes-dentista/atestado-dentista/atestado-dentista.component';
import { ComprovantePagamentoDentistaComponent } from './impressoes-dentista/comprovante-pagamento-dentista/comprovante-pagamento-dentista.component';
import { ExamesDentistaComponent } from './impressoes-dentista/exames-dentista/exames-dentista.component';
import { HistoricoCompletoDentistaComponent } from './impressoes-dentista/historico-completo-dentista/historico-completo-dentista.component';
import { PlanejamentoDentistaComponent } from './impressoes-dentista/planejamento-dentista/planejamento-dentista.component';
import { PrescricaoDentistaComponent } from './impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { QuestionarioSaudeDentistaComponent } from './impressoes-dentista/questionario-saude-dentista/questionario-saude-dentista.component';
import { RegistroConsultaDentistaComponent } from './impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';

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
console.log("dialogRef",dialogRef)
    dialogRef.afterClosed().subscribe((opcao: string) => {
      if (!opcao) { return; }

      if (opcao === '3') {
        this.imprimirHistoricoCompletoAdmin(element);
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
    console.log("profissonal",element, perfilUsuario)
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
        this.imprimirHistoricoCompletoProfissional(element, perfilUsuario);
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
   * Imprime histórico completo no contexto admin.
   * Tenta prontuário médico primeiro; se não existir, abre o de dentista.
   * @param dados - Dados da consulta
   */
  private imprimirHistoricoCompletoAdmin(dados: Consultav2): void {
    const dialogConfig = { width: this.DIALOG_WIDTH, height: this.DIALOG_HEIGHT, data: dados };
    this.prontuarioApiService.buscarProntuarioById(dados.id).subscribe(
      () => this.dialog.open(HistoricoCompletoMedicoComponent, dialogConfig),
      () => this.dialog.open(HistoricoCompletoDentistaComponent, dialogConfig)
    );
  }

  /**
   * Imprime histórico completo no contexto profissional.
   * Abre diretamente o componente correto baseado no perfil.
   * @param dados - Dados da consulta
   * @param perfilUsuario - 'MEDICO' ou 'DENTISTA'
   */
  private imprimirHistoricoCompletoProfissional(dados: Consultav2, perfilUsuario: string): void {
    const dialogConfig = { width: this.DIALOG_WIDTH, height: this.DIALOG_HEIGHT, data: dados };
    if (perfilUsuario === 'DENTISTA') {
      this.dialog.open(HistoricoCompletoDentistaComponent, dialogConfig);
    } else {
      this.dialog.open(HistoricoCompletoMedicoComponent, dialogConfig);
    }
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
