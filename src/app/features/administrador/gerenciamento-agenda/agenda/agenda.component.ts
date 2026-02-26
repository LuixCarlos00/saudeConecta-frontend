import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { MatDialog } from '@angular/material/dialog';
import { CronologiaComponent } from 'src/app/util/variados/Cronologia/cronologia.component';
import Swal from 'sweetalert2';
import { EditarConsultasComponent } from './Editar-Consultas/Editar-Consultas.component';
import { Template_PDFComponent } from './template_PDF/template_PDF.component';
import { ObservacoesComponent } from './Observacoes/Observacoes.component';
import { Tabela } from 'src/app/util/variados/interfaces/tabela/Tabela';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { SelecaoRelatorioComponent } from 'src/app/features/medico/impressoes/selecao-relatorio/selecao-relatorio.component';
import { ImprimirPrescricaoComponent } from 'src/app/features/medico/impressoes/ImprimirPrescricao/ImprimirPrescricao.component';
import { ImprimirSoliciatacaoDeExamesComponent } from 'src/app/features/medico/impressoes/ImprimirSoliciatacaoDeExames/ImprimirSoliciatacaoDeExames.component';
import { AtestadoPacienteComponent } from 'src/app/features/medico/impressoes/AtestadoPaciente/AtestadoPaciente.component';
import { HistoricoCompletoComponent } from 'src/app/features/medico/impressoes/historicoCompleto/historicoCompleto.component';
import { ImprimirRegistroComponent } from 'src/app/features/medico/impressoes/ImprimirRegistro/ImprimirRegistro.component';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { SolicitacaoExamesDentistaComponent } from 'src/app/features/medico/impressoes-dentista/solicitacao-exames-dentista/solicitacao-exames-dentista.component';
import { PrescricaoDentistaComponent } from 'src/app/features/medico/impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { AtestadoDentistaComponent } from 'src/app/features/medico/impressoes-dentista/atestado-dentista/atestado-dentista.component';
import { RegistroConsultaDentistaComponent } from 'src/app/features/medico/impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';

type TipoVisualizacao = 'AGENDADA' | 'REALIZADA';
type TipoPeriodo = 'diario' | 'semanal' | 'mensal' | 'anual';

const STATUS_AGENDADAS = ['AGENDADA', 'CONFIRMADA'];
const STATUS_FINALIZADAS = ['REALIZADA', 'CANCELADA'];

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
})
export class AgendaComponent implements OnInit, OnDestroy {
  FormularioAgenda!: FormGroup;
  dataSource: Consultav2[] = [];
  displayedColumns: string[] = ['consulta', 'medico', 'paciente', 'diaSemana', 'data', 'horario', 'status', 'Seleciona'];
  Finalizadas = false;
  clickedRows = new Set<Tabela>();
  ValorOpcao: any;
  tipoPeriodoSelecionado: TipoPeriodo = 'diario';
  private destroy$ = new Subject<void>();

  UsuarioLogado: Usuario = { id: 0, aud: '', exp: '', iss: '', sub: '' };

  constructor(
    private formBuilder: FormBuilder,
    private consultaApi: ConsultaApiService,
    public dialog: MatDialog,
    private consultaState: ConsultaStateService,
    private prontuarioApiService: ProntuarioApiService,
    private tokenService: tokenService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService
  ) { }

  async ngOnInit() {
    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$
      .pipe(takeUntil(this.destroy$))
      .subscribe((usuario) => {
        if (usuario?.id) { this.UsuarioLogado = usuario; }
      });

    this.buscarDadosParaTabela();
    this.FormularioAgenda = this.formBuilder.group({ busca: [''] });

    this.consultaState.dadosCronologia$.subscribe((dados) => {
      if (dados && Array.isArray(dados) && dados.length > 0) {
        this.processarDadosCronologia(dados);
      }
    });

    this.consultaState.cadastroRealizado$.subscribe((dados) => {
      if (dados) { this.Recarregar(); }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



  // ─────────────────────────────────────────────────────────────────────────────
  // Dados da tabela
  // ─────────────────────────────────────────────────────────────────────────────

  async buscarDadosParaTabela() {
    try {
      const dados = await this.buscarConsultasPorPeriodo();
      if (Array.isArray(dados)) {
        const tipo: TipoVisualizacao = this.Finalizadas ? 'REALIZADA' : 'AGENDADA';
        this.dataSource = this.filtrarConsultasPorTipo(dados, tipo);
        console.log(this.dataSource)
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Erro ao buscar dados da tabela.', 'error');
    }
  }

  async PesquisarNaTabelaConcluidos() {
    this.Finalizadas = true;
    this.buscarDadosParaTabela();
  }

  PesquisarNaTabelaAgendadas() {
    this.Finalizadas = false;
    this.buscarDadosParaTabela();
  }

  selecionarPeriodo(periodo: TipoPeriodo) {
    this.tipoPeriodoSelecionado = periodo;
    this.buscarDadosParaTabela();
  }

  private async buscarConsultasPorPeriodo(): Promise<any[] | undefined> {
    switch (this.tipoPeriodoSelecionado) {
      case 'diario': return this.consultaApi.buscarDoDiaAtual().toPromise();
      case 'semanal': return this.consultaApi.buscarDaSemanaAtual().toPromise();
      case 'mensal': return this.consultaApi.buscarDoMesAtual().toPromise();
      case 'anual': return this.consultaApi.buscarDoAnoAtual().toPromise();
      default: return this.consultaApi.buscarDoDiaAtual().toPromise();
    }
  }

  async Pesquisar() {
    const busca = this.FormularioAgenda.get('busca')?.value;
    this.FormularioAgenda.reset();
    try {
      const dados = await this.filtrarDadosPesquisa(busca, this.dataSource);
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

  private filtrarDadosPesquisa(busca: string, dataSource: Consultav2[]): Promise<Consultav2[]> {
    return new Promise((resolve, reject) => {
      try {
        const normalize = (str: string | undefined | null) =>
          str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || '';
        const termo = normalize(busca?.trim());
        resolve(dataSource.filter(item =>
          normalize(String(item.id)).includes(termo) ||
          normalize(item.profissionalNome).includes(termo) ||
          normalize(item.profissionalConselho).includes(termo) ||
          normalize(item.pacienteNome).includes(termo) ||
          normalize(item.especialidadeNome).includes(termo) ||
          normalize(item.dataHora).includes(termo) ||
          normalize(item.status).includes(termo) ||
          normalize(item.formaPagamentoNome).includes(termo) ||
          normalize(item.observacoes).includes(termo)
        ));
      } catch (error) {
        reject(error);
      }
    });
  }

  Recarregar() {
    this.Finalizadas ? this.PesquisarNaTabelaConcluidos() : this.buscarDadosParaTabela();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Ações da tabela
  // ─────────────────────────────────────────────────────────────────────────────

  async Deletar(consulta: Tabela) {
    try {
      await this.consultaApi.deletarConsulta(consulta.consulta).toPromise();
      Swal.fire('Deletado', 'Consulta deletada com sucesso', 'success');
      this.buscarDadosParaTabela();
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Erro ao deletar consulta', 'error');
    }
  }

  Editar(consulta: any) {
    this.dialog.open(EditarConsultasComponent, {
      width: '800px',
      height: 'auto',
      data: { consulta },
    });
    this.dialog.afterAllClosed.subscribe(() => this.buscarDadosParaTabela());
  }

  Concluido(elemento: any) {
    Swal.fire({
      title: 'Tem certeza que deseja concluir esse registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5ccf6c',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, Concluir!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.consultaApi.concluirConsultabyOrg(elemento.id).subscribe(
          () => {
            Swal.fire('Concluído', 'Concluído com sucesso', 'success');
            this.buscarDadosParaTabela();
          },
          (error) => {
            Swal.fire('Erro', 'Erro ao concluir', 'error');
            console.error(error);
          }
        );
      } else {
        this.buscarDadosParaTabela();
      }
    });
  }

  AlterarStatus(elemento: Consultav2, novoStatus: string) {
    if (novoStatus === elemento.status) { return; }
    if (novoStatus === 'CONFIRMADA') {
      this.Confirmar(elemento);
    } else if (novoStatus === 'CANCELADA') {
      this.Cancelar(elemento);
    }
  }

  Confirmar(elemento: Consultav2) {
    Swal.fire({
      title: 'Confirmar consulta?',
      text: `Consulta de ${elemento.pacienteNome} será marcada como CONFIRMADA.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, confirmar!',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.consultaApi.confirmarConsulta(elemento.id).subscribe({
          next: () => {
            Swal.fire('Confirmada!', 'Consulta confirmada com sucesso.', 'success');
            this.buscarDadosParaTabela();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível confirmar a consulta.', 'error');
          },
        });
      }
    });
  }

  Cancelar(elemento: Consultav2) {
    Swal.fire({
      title: 'Cancelar consulta?',
      input: 'textarea',
      inputLabel: 'Motivo do cancelamento',
      inputPlaceholder: 'Informe o motivo...',
      inputAttributes: { 'aria-label': 'Motivo' },
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Cancelar consulta',
      cancelButtonText: 'Voltar',
      inputValidator: (value) => {
        if (!value || value.trim().length < 3) {
          return 'Informe o motivo do cancelamento (mínimo 3 caracteres).';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.consultaApi.cancelarConsulta(elemento.id, result.value).subscribe({
          next: () => {
            Swal.fire('Cancelada!', 'Consulta cancelada com sucesso.', 'success');
            this.buscarDadosParaTabela();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível cancelar a consulta.', 'error');
          },
        });
      }
    });
  }

  getLabelStatus(status: string): string {
    const labels: Record<string, string> = {
      AGENDADA: 'Agendada',
      CONFIRMADA: 'Confirmada',
      REALIZADA: 'Realizada',
      CANCELADA: 'Cancelada',
    };
    return labels[status] ?? status;
  }

  Observacoes(observacoes: string): void {
    this.dialog.open(ObservacoesComponent, { width: 'auto', data: { observacoes } });
  }

  GerarPDF(consulta: Consultav2): void {
    try {
      this.dialog.open(Template_PDFComponent, {
        width: 'auto',
        height: 'auto',
        data: consulta,
        panelClass: 'template-pdf-dialog',
      });
    } catch (error) {
      console.error('GerarPDF - erro ao abrir diálogo:', error);
      Swal.fire({
        title: 'Erro',
        text: 'Não foi possível abrir a tela de geração de PDF. Tente novamente.',
        icon: 'error',
        confirmButtonColor: '#0066CC',
        confirmButtonText: 'OK',
      });
    }
  }

  CronogramaDoDia() {
    this.dialog.open(CronologiaComponent, {
      width: 'auto',
      panelClass: 'cronologia-dialog',
      data: { Pesquisa: this.Finalizadas },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Impressões — acesso exclusivo do Administrador
  //
  // Fluxo:
  //   1. Abre o seletor de relatório
  //   2. Opção 3 (Histórico) não precisa de prontuário → abre direto
  //   3. Para as demais, tenta buscar o prontuário médico primeiro.
  //      Se a consulta for odontológica o endpoint médico retornará erro (404),
  //      então o catch faz fallback automático para o prontuário dentista.
  //   4. O mapa de ações (Record) substitui o switch/case, mantendo o código
  //      conciso e fácil de estender.
  // ─────────────────────────────────────────────────────────────────────────────
  AbrirOpcoesImpressao(element: Consultav2) {
    const dialogRef = this.dialog.open(SelecaoRelatorioComponent, {
      maxWidth: 'auto',
      panelClass: 'selecao-relatorio-dialog',
      data: {
        consulta: element,
        consultaNaoRealizada: (element.status as any) === 'AGENDADA',
        isAdmin: false,
      },
    });

    dialogRef.afterClosed().subscribe((opcao: string) => {
      if (!opcao) { return; }

      if (opcao === '3') {
        this.ImprimirHistoricoCompleto(element);
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

  private abrirDialogImpressaoMedico(opcao: string, dados: Prontuario) {
    const acoes: Record<string, () => void> = {
      '1': () => this.ImprimirSolicitacaoDeExames(dados),
      '2': () => this.ImprimirPrescricao(dados),
      '4': () => this.ImprimirAtestado(dados),
      '5': () => this.ImprimirRegistro(dados),
    };
    acoes[opcao]?.();
  }

  private abrirDialogImpressaoDentista(opcao: string, dados: Prontuario) {
    const acoes: Record<string, () => void> = {
      '1': () => this.solicitacaoExamesDentista(dados),
      '2': () => this.prescricaoDentista(dados),
      '4': () => this.atestadoDentista(dados),
      '5': () => this.registroConsultaDentista(dados),
    };
    acoes[opcao]?.();
  }

  private mostrarErroProntuarioNaoEncontrado() {
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

  // ── Dialogs Médico ───────────────────────────────────────────────────────────

  ImprimirPrescricao(prontuario: Prontuario) {
    this.dialog.open(ImprimirPrescricaoComponent, { width: '60%', height: '90%', data: prontuario });
  }

  ImprimirSolicitacaoDeExames(prontuario: Prontuario) {
    this.dialog.open(ImprimirSoliciatacaoDeExamesComponent, { width: '60%', height: '90%', data: prontuario });
  }

  ImprimirAtestado(prontuario: Prontuario) {
    this.dialog.open(AtestadoPacienteComponent, { width: '60%', height: '90%', data: prontuario });
  }

  ImprimirRegistro(prontuario: Prontuario) {
    this.dialog.open(ImprimirRegistroComponent, { width: '60%', height: '90%', data: prontuario });
  }

  ImprimirHistoricoCompleto(dados: Consultav2) {
    this.dialog.open(HistoricoCompletoComponent, { width: '60%', height: '90%', data: dados });
  }

  // ── Dialogs Dentista ─────────────────────────────────────────────────────────

  solicitacaoExamesDentista(dados: Prontuario) {
    this.dialog.open(SolicitacaoExamesDentistaComponent, { width: '60%', height: '90%', data: dados });
  }

  prescricaoDentista(dados: Prontuario) {
    this.dialog.open(PrescricaoDentistaComponent, { width: '60%', height: '90%', data: dados });
  }

  atestadoDentista(dados: Prontuario) {
    this.dialog.open(AtestadoDentistaComponent, { width: '60%', height: '90%', data: dados });
  }

  registroConsultaDentista(dados: Prontuario) {
    this.dialog.open(RegistroConsultaDentistaComponent, { width: '60%', height: '90%', data: dados });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilitários privados
  // ─────────────────────────────────────────────────────────────────────────────

  private filtrarConsultasPorTipo(dados: any[], tipo: TipoVisualizacao): any[] {
    const permitidos = tipo === 'AGENDADA' ? STATUS_AGENDADAS : STATUS_FINALIZADAS;
    return dados.filter(c => permitidos.includes(c.status));
  }

  private processarDadosCronologia(dados: any[]): void {
    const agendadas = this.filtrarConsultasPorTipo(dados, 'AGENDADA');
    const finalizadas = this.filtrarConsultasPorTipo(dados, 'REALIZADA');

    if (finalizadas.length > 0 && agendadas.length === 0) {
      this.Finalizadas = true;
      this.dataSource = finalizadas;
    } else if (agendadas.length > 0) {
      this.Finalizadas = false;
      this.dataSource = agendadas;
    } else {
      this.dataSource = dados;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Gerar Link do Planejamento Terapêutico
  // ─────────────────────────────────────────────────────────────────────────────
  gerarLinkPlanejamento(element: Consultav2): void {
    if (!element?.id) return;
    this.prontuarioDentistaApiService.buscarProntuarioDentistaById(element.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario: any) => {
          if (!prontuario?.codigo) {
            Swal.fire('Aviso', 'Nenhum prontuário encontrado para esta consulta.', 'warning');
            return;
          }
          this.planejamentoApi.gerarLinkAssinatura(prontuario.codigo)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (resp) => {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/#/assinatura-planejamento/${resp.token}`;
                navigator.clipboard.writeText(link).then(() => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Link Gerado!',
                    html: `<p style="font-size:0.9rem;">Link do planejamento copiado para a área de transferência.</p>
                           <input type="text" value="${link}" readonly
                             style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
                    confirmButtonText: 'OK'
                  });
                }).catch(() => {
                  Swal.fire({
                    icon: 'info',
                    title: 'Link Gerado',
                    html: `<p style="font-size:0.9rem;">Copie o link abaixo e envie ao paciente:</p>
                           <input type="text" value="${link}" readonly
                             style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
                    confirmButtonText: 'OK'
                  });
                });
              },
              error: () => {
                Swal.fire('Erro', 'Não foi possível gerar o link do planejamento.', 'error');
              }
            });
        },
        error: () => {
          Swal.fire('Erro', 'Não foi possível buscar o prontuário desta consulta.', 'error');
        }
      });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Gerar Link do Questionário de Saúde
  // ─────────────────────────────────────────────────────────────────────────────
  gerarLinkQuestionario(element: Consultav2): void {
    console.log(element);
    if (!element?.id) return;
    this.prontuarioDentistaApiService.gerarLinkQuestionario(element.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const baseUrl = window.location.origin;
          const link = `${baseUrl}/#/questionario-saude/${resp.token}`;
          navigator.clipboard.writeText(link).then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Link Gerado!',
              html: `<p style="font-size:0.9rem;">Link copiado para a área de transferência.</p>
                     <input type="text" value="${link}" readonly
                       style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
              confirmButtonText: 'OK'
            });
          }).catch(() => {
            Swal.fire({
              icon: 'info',
              title: 'Link Gerado',
              html: `<p style="font-size:0.9rem;">Copie o link abaixo e envie ao paciente:</p>
                     <input type="text" value="${link}" readonly
                       style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
              confirmButtonText: 'OK'
            });
          });
        },
        error: () => {
          Swal.fire('Erro', 'Não foi possível gerar o link do questionário.', 'error');
        }
      });
  }

  tratarDadosParaTabela(dados: any[]): Tabela[] {
    return dados.map((dado) => ({
      consulta: dado.id,
      medico: dado.profissionalNome,
      paciente: dado.pacienteNome,
      data: dado.dataHora,
      horario: dado.dataHora,
      observacao: dado.observacoes,
      dadaCriacao: dado.createdAt,
      status: dado.status,
      adm: dado.conAdm,
      formaPagamento: dado.formaPagamentoId,
    }));
  }
}
