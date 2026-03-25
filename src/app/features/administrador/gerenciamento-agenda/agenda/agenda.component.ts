import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ConsultaStateService } from 'src/app/services/state/consulta-state.service';
import { MatDialog } from '@angular/material/dialog';
import { CronologiaComponent } from 'src/app/util/variados/Cronologia/cronologia.component';
import Swal from 'sweetalert2';
import { EditarConsultasComponent } from './Editar-Consultas/Editar-Consultas.component';
import { ObservacoesComponent } from './Observacoes/Observacoes.component';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { tokenService } from 'src/app/util/Token/Token.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';
import { RelatorioService } from 'src/app/features/relatorio/relatorio.service';
    
type TipoVisualizacao = 'AGENDADA' | 'REALIZADA';
type TipoPeriodo = 'diario' | 'semanal' | 'mensal' | 'anual';

interface DadosCronologiaAlteracao {
  alteracao: {
    id: number;
    novoStatus: string;
    motivo?: string;
  };
}

interface DadosCronologiaBusca extends Array<any> {}

const STATUS_AGENDADAS = ['AGENDADA', 'CONFIRMADA'];
const STATUS_FINALIZADAS = ['REALIZADA', 'CANCELADA', 'PAGO'];

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
})
export class AgendaComponent implements OnInit, OnDestroy {
  FormularioAgenda!: FormGroup;
  dataSource: Consultav2[] = [];
  displayedColumns: string[] = ['consulta', 'medico', 'paciente', 'diaSemana', 'data', 'horario', 'status', 'Seleciona'];
  displayedColumnsFinalizadas: string[] = ['consulta', 'medico', 'paciente', 'diaSemana', 'data', 'horario', 'status', 'statusPagamento', 'Seleciona'];
  Finalizadas = false;
  clickedRows = new Set<any>();
  planejamentosAssinados = new Set<number>();
  questionariosRespondidos = new Set<number>();
  ValorOpcao: any;
  tipoPeriodoSelecionado: TipoPeriodo = 'diario';
  private destroy$ = new Subject<void>();
  private emModoBuscaLocal = false; // Flag para controlar modo de busca

  UsuarioLogado: Usuario = { id: 0, aud: '', exp: '', iss: '', sub: '' };


  constructor(
    private formBuilder: FormBuilder,
    private consultaApi: ConsultaApiService,
    public dialog: MatDialog,
    private consultaState: ConsultaStateService,
    private tokenService: tokenService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService,
    private prontuarioApiService: ProntuarioApiService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService,
    private relatorioService: RelatorioService
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
      if (!this.emModoBuscaLocal && dados && (Array.isArray(dados) || 'alteracao' in dados)) {
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
     this.emModoBuscaLocal = false;

     try {
      const dados = await this.buscarConsultasPorPeriodo();
      console.log(dados,"aaa")
      if (Array.isArray(dados)) {
        const tipo: TipoVisualizacao = this.Finalizadas ? 'REALIZADA' : 'AGENDADA';
        this.dataSource = this.filtrarConsultasPorTipo(dados, tipo);
        if (this.Finalizadas) {
          this.verificarPlanejamentosAssinados();
        } else {
          this.verificarQuestionariosRespondidos();
        }
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

    this.emModoBuscaLocal = true;

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
    } finally {
      setTimeout(() => {
        this.emModoBuscaLocal = false;
      }, 100);
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
    this.emModoBuscaLocal = false;
    this.Finalizadas ? this.PesquisarNaTabelaConcluidos() : this.buscarDadosParaTabela();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Ações da tabela
  // ─────────────────────────────────────────────────────────────────────────────

  async Deletar(consulta: Consultav2) {
    const confirmar = await Swal.fire({
      title: 'Confirmar exclusão',
      text: `Deseja excluir a consulta de ${consulta.pacienteNome}? O questionário de saúde será excluído.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmar.isConfirmed) return;

    try {
      await this.consultaApi.deletarConsulta(consulta.id).toPromise();
      Swal.fire('Deletado', 'Consulta deletada com sucesso', 'success');
      this.buscarDadosParaTabela();
    } catch (error: any) {
      const status = error?.status;
      if (status === 409) {
        Swal.fire('Exclusão bloqueada', 'Esta consulta possui prontuário clínico e não pode ser excluída. Os dados clínicos devem ser preservados.', 'info');
      } else {
        Swal.fire('Erro', 'Erro ao deletar consulta', 'error');
      }
    }
  }

podeEditar(consulta: any): boolean {
    return consulta?.status === 'AGENDADA';
  }

Editar(consulta: any) {
    if (!this.podeEditar(consulta)) { return; }

  const dialogRef = this.dialog.open(EditarConsultasComponent, {
    width: '800px',
    height: 'auto',
    data: { consulta },
  });


  dialogRef.afterClosed().subscribe((resultado) => {
    if (resultado === 'salvo') {
      this.buscarDadosParaTabela();
    }
  });
}


  AlterarStatus(elemento: Consultav2, novoStatus: string) {
    if (novoStatus === elemento.status) { return; }


    const statusConfig: Record<string, any> = {
      'CONFIRMADA': {
        title: 'Confirmar consulta?',
        text: `Consulta de ${elemento.pacienteNome} será marcada como CONFIRMADA.`,
        confirmText: 'Sim, confirmar!',
        confirmColor: '#2563eb'
      },
      'CANCELADA': {
        title: 'Cancelar consulta?',
        text: `Consulta de ${elemento.pacienteNome} será CANCELADA.`,
        confirmText: 'Sim, cancelar!',
        confirmColor: '#dc2626',
        requiresMotivo: true
      },
      'AGENDADA': {
        title: 'Voltar consulta para Agendada?',
        text: `Consulta de ${elemento.pacienteNome} voltará para status AGENDADA.`,
        confirmText: 'Sim, voltar para Agendada!',
        confirmColor: '#f59e0b'
      },
      'PAGO': {
        title: 'Marcar consulta como Paga?',
        text: `Consulta de ${elemento.pacienteNome} será marcada como PAGO.`,
        confirmText: 'Sim, marcar como pago!',
        confirmColor: '#27ae60'
      }
    };

    const config = statusConfig[novoStatus];
    if (!config) {
      console.error('Status não reconhecido:', novoStatus);
      return;
    }

     if (config.requiresMotivo) {
      Swal.fire({
        title: config.title,
        text: config.text,
        icon: 'question',
        input: 'textarea',
        inputLabel: 'Motivo do cancelamento',
        inputPlaceholder: 'Informe o motivo...',
        inputValidator: (value) => {
          if (!value || value.trim().length < 3) {
            return 'Informe o motivo (mínimo 3 caracteres).';
          }
          return null;
        },
        showCancelButton: true,
        confirmButtonColor: config.confirmColor,
        cancelButtonColor: '#6b7280',
        confirmButtonText: config.confirmText,
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          this.executarAlteracaoStatusComFeedback(elemento.id, novoStatus, result.value);
        }
      });
    } else {
      // Status que não precisam de motivo
      Swal.fire({
        title: config.title,
        text: config.text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: config.confirmColor,
        cancelButtonColor: '#6b7280',
        confirmButtonText: config.confirmText,
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.executarAlteracaoStatusComFeedback(elemento.id, novoStatus);
        }
      });
    }
  }

  private executarAlteracaoStatus(id: number, status: string, motivo?: string): Observable<Consultav2> {
    const statusLabels: Record<string, string> = {
      'CONFIRMADA': 'Confirmada',
      'CANCELADA': 'Cancelada',
      'AGENDADA': 'Agendada',
      'REALIZADA': 'Realizada',
      'PAGO': 'Paga'
    };

    // Usa o endpoint único do backend
    return this.consultaApi.alterarStatusConsulta(id, status, motivo);
  }

  private executarAlteracaoStatusComFeedback(id: number, status: string, motivo?: string): void {
    this.executarAlteracaoStatus(id, status, motivo).subscribe({
      next: () => {
        const statusLabels: Record<string, string> = {
          'CONFIRMADA': 'Confirmada',
          'CANCELADA': 'Cancelada',
          'AGENDADA': 'Agendada',
          'REALIZADA': 'Realizada',
          'PAGO': 'Paga'
        };
        Swal.fire(`${statusLabels[status]}!`, `Consulta marcada como ${statusLabels[status].toLowerCase()} com sucesso.`, 'success');
        this.buscarDadosParaTabela();
      },
      error: (err: any) => {
        console.error(err);
        const statusLabels: Record<string, string> = {
          'CONFIRMADA': 'Confirmada',
          'CANCELADA': 'Cancelada',
          'AGENDADA': 'Agendada',
          'REALIZADA': 'Realizada',
          'PAGO': 'Paga'
        };
        Swal.fire('Erro', `Não foi possível alterar a consulta para ${statusLabels[status].toLowerCase()}.`, 'error');
      },
    });
  }

  getLabelStatus(status: string): string {
    const labels: Record<string, string> = {
      AGENDADA: 'Agendada',
      CONFIRMADA: 'Confirmada',
      REALIZADA: 'Realizada',
      CANCELADA: 'Cancelada',
      PAGO: 'Pago',
    };
    return labels[status] ?? status;
  }

  /**
   * Retorna o label do status de pagamento para exibição na coluna.
   */
  getLabelStatusPagamento(status: string): string {
    return status === 'PAGO' ? 'Pago' : 'Pendente';
  }

  Observacoes(observacoes: string): void {
    this.dialog.open(ObservacoesComponent, { width: 'auto', data: { observacoes } });
  }

  VerMotivoCancelamento(motivo: string): void {
    Swal.fire({
      title: 'Motivo do Cancelamento',
      html: `<div style="text-align: left; padding: 10px;">
               <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                 ${motivo}
               </p>
             </div>`,
      icon: 'info',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Fechar',
      width: '500px'
    });
  }

  CronogramaDoDia() {
    this.dialog.open(CronologiaComponent, {
      //width: 'auto',
      //panelClass: 'cronologia-dialog',
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
  // Impressões — delegadas ao RelatorioService centralizado
  // ─────────────────────────────────────────────────────────────────────────────
  AbrirOpcoesImpressao(element: Consultav2) {
    this.relatorioService.abrirRelatorioAdmin(element);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilitários privados
  // ─────────────────────────────────────────────────────────────────────────────

  private filtrarConsultasPorTipo(dados: any[], tipo: TipoVisualizacao): any[] {
    const permitidos = tipo === 'AGENDADA' ? STATUS_AGENDADAS : STATUS_FINALIZADAS;
    return dados.filter(c => permitidos.includes(c.status));
  }

  private processarDadosCronologia(dados: DadosCronologiaBusca | DadosCronologiaAlteracao): void {
    // Mantém o contexto atual (Finalizadas ou Agendadas) escolhido pelo usuário
    const tipo: TipoVisualizacao = this.Finalizadas ? 'REALIZADA' : 'AGENDADA';

    // Verifica se é uma alteração específica
    if (dados && 'alteracao' in dados) {
      // Processa apenas a alteração específica
      this.processarAlteracaoEspecifica((dados as DadosCronologiaAlteracao).alteracao);
      return;
    }

    // Trata como array de dados normal
    const dadosArray = dados as DadosCronologiaBusca;

    // Sempre atualiza o dataSource, mesmo que os dados sejam vazios
    if (dadosArray && Array.isArray(dadosArray) && dadosArray.length > 0) {
      const dadosFiltrados = this.filtrarConsultasPorTipo(dadosArray, tipo);
      this.dataSource = dadosFiltrados;
    } else {
      // Se não houver dados ou for null/undefined, limpa a tabela
      this.dataSource = [];


      if (dadosArray && Array.isArray(dadosArray) && dadosArray.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Nenhum resultado',
          text: `Nenhuma consulta ${this.Finalizadas ? 'finalizada' : 'agendada'} encontrada com os filtros selecionados.`,
          confirmButtonColor: '#0066CC'
        });
      }
    }
  }

  /**
   * Processa uma alteração específica vinda da Cronologia
   * Atualiza apenas o registro alterado e recarrega os dados da tabela
   */
  private processarAlteracaoEspecifica(alteracao: DadosCronologiaAlteracao['alteracao']): void {
    // Executa a alteração específica usando o mesmo endpoint do AlterarStatus
    this.executarAlteracaoStatus(alteracao.id, alteracao.novoStatus, alteracao.motivo)
      .subscribe({
        next: () => {
          // Recarrega os dados da tabela para refletir a alteração
          this.buscarDadosParaTabela();

          Swal.fire({
            icon: 'success',
            title: 'Alteração realizada!',
            text: `Consulta alterada para ${alteracao.novoStatus} com sucesso.`,
            confirmButtonColor: '#27ae60'
          });
        },
        error: (error) => {
          console.error('Erro ao processar alteração específica:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erro na alteração',
            text: 'Não foi possível realizar a alteração. Tente novamente.',
            confirmButtonColor: '#dc2626'
          });
        }
      });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Gerar Link do Planejamento Terapêutico
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Busca o prontuário mais recente da consulta de acordo com o tipo de profissional.
   * Dentista: usa ProntuarioDentistaApiService (retorna campo "codigo")
   * Médico: usa ProntuarioApiService (retorna campo "codigoProntuario")
   */
  private buscarProntuarioMaisRecente(consulta: Consultav2): Observable<any> {
    const tipo = this.relatorioService.detectarTipoProfissional(consulta);
    if (tipo === 'DENTISTA') {
      return this.prontuarioDentistaApiService.buscarProntuarioDentistaById(consulta.id);
    }
    return this.prontuarioApiService.buscarMaisRecentePorConsulta(consulta.id);
  }

  /**
   * Extrai o ID do prontuário independente do tipo (dentista: "codigo", médico: "codigoProntuario")
   */
  private extrairCodigoProntuario(prontuario: any): number | null {
    return prontuario?.codigo ?? prontuario?.codigoProntuario ?? null;
  }

  private verificarPlanejamentosAssinados(): void {
    const finalizadas = this.dataSource.filter(c => c.status === 'REALIZADA');
    for (const consulta of finalizadas) {
      if (!consulta?.id || this.planejamentosAssinados.has(consulta.id)) continue;
      this.buscarProntuarioMaisRecente(consulta)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (prontuario: any) => {
            const plans = prontuario?.planejamentosTerapeuticos || prontuario?.planejamentos || [];
            if (plans.length > 0 && plans.every((p: any) => p.statusAssinatura === 'ASSINADO')) {
              this.planejamentosAssinados.add(consulta.id);
            }
          }
        });
    }
  }

  gerarLinkPlanejamento(element: Consultav2): void {
    if (!element?.id) return;
    const tipoProfissional = this.relatorioService.detectarTipoProfissional(element);
    this.buscarProntuarioMaisRecente(element)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario: any) => {
          const codigoProntuario = this.extrairCodigoProntuario(prontuario);
          if (!codigoProntuario) {
            Swal.fire('Aviso', 'Nenhum prontuário encontrado para esta consulta.', 'warning');
            return;
          }
          const plans = prontuario?.planejamentosTerapeuticos || prontuario?.planejamentos || [];
          if (plans.length > 0 && plans.every((p: any) => p.statusAssinatura === 'ASSINADO')) {
            this.planejamentosAssinados.add(element.id);
            Swal.fire('Aviso', 'Todos os itens do planejamento já foram assinados pelo paciente.', 'info');
            return;
          }
          this.planejamentoApi.gerarLinkAssinatura(codigoProntuario, tipoProfissional)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (resp) => {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/#/assinatura-planejamento/${resp.token}`;
                navigator.clipboard.writeText(link).catch(() => {});
                Swal.fire({
                  icon: 'success',
                  title: 'Link Gerado!',
                  html: `<p style="font-size:0.9rem;">Copie o link abaixo e envie ao paciente:</p>
                         <input type="text" value="${link}" readonly
                           style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
                  confirmButtonText: 'OK'
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
  private verificarQuestionariosRespondidos(): void {
    const confirmadas = this.dataSource.filter(c => c.status === 'CONFIRMADA');
    for (const consulta of confirmadas) {
      if (!consulta?.id || this.questionariosRespondidos.has(consulta.id)) continue;
      this.prontuarioDentistaApiService.buscarQuestionarioSaude(consulta.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: any) => {
            if (resp?.respondido) {
              this.questionariosRespondidos.add(consulta.id);
            }
          }
        });
    }
  }

  gerarLinkQuestionario(element: Consultav2): void {
    if (!element?.id) return;

    // Verifica se já foi respondido antes de gerar
    this.prontuarioDentistaApiService.buscarQuestionarioSaude(element.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp?.respondido) {
            this.questionariosRespondidos.add(element.id);
            Swal.fire('Aviso', 'O questionário de saúde já foi respondido e assinado pelo paciente.', 'info');
            return;
          }
          this.executarGeracaoLinkQuestionario(element);
        },
        error: () => {
          // Se não encontrou questionário, permite gerar o link
          this.executarGeracaoLinkQuestionario(element);
        }
      });
  }

  private executarGeracaoLinkQuestionario(element: Consultav2): void {
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

  // ─────────────────────────────────────────────────────────────────────────────
  // WhatsApp Individual
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Gera o link do WhatsApp Web com mensagem personalizada para o paciente.
   * @param consulta - Dados da consulta com telefone do paciente
   * @returns URL completa para wa.me com mensagem codificada
   */
  gerarLinkWhatsApp(consulta: Consultav2): string {
    if (!consulta.pacienteTelefone) { return ''; }

    const telefone = this.formatarTelefoneWhatsApp(consulta.pacienteTelefone);
    const mensagem = this.gerarMensagemWhatsApp(consulta);
    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  }

  /**
   * Gera a mensagem de confirmação de consulta com dados dinâmicos.
   * @param consulta - Dados da consulta
   * @returns Mensagem personalizada com nome, médico, data e horário
   */
  private gerarMensagemWhatsApp(consulta: Consultav2): string {
    const dataHora = new Date(consulta.dataHora);
    const data = dataHora.toLocaleDateString('pt-BR');
    const horario = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const paciente = consulta.pacienteNome || 'Paciente';
    const medico = consulta.profissionalNome || 'Profissional';

    return `Olá ${paciente}, tudo bem?\n\nGostaríamos de confirmar sua consulta com ${medico} no dia ${data} às ${horario}.\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nAtenciosamente,\nEquipe da Clínica.`;
  }

  /**
   * Formata o número de telefone para o padrão internacional brasileiro.
   * Remove caracteres não numéricos e adiciona o código do país.
   * @param telefone - Número de telefone em qualquer formato
   * @returns Número formatado com código 55 do Brasil
   */
  private formatarTelefoneWhatsApp(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.startsWith('55') ? numeros : '55' + numeros;
  }
}
