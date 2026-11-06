import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ControleAcessoApiService } from 'src/app/core/data-access/controle-acesso-api.service';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/core/data-access/planejamento-terapeutico-api.service';
import { ProntuarioDentistaApiService } from 'src/app/core/data-access/prontuario-dentista-api.service';
import { ProntuarioStateService } from 'src/app/core/data-access/prontuario-state.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { RelatorioService } from 'src/app/features/relatorios';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { Usuario } from 'src/app/shared/models/usuario';
import { extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';
import { AcoesConsultaService } from '../../../data-access/acoes-consulta.service';
import {
  STATUS_LABELS,
  classeStatus,
  etapaConcluida,
  horarioLocal,
  podeEditarConsultaPorPerfil,
  temRascunho,
} from '../agenda-calendario.calculos';

/**
 * Drawer lateral com os detalhes da consulta selecionada e as ações rápidas (alterar status,
 * iniciar/retomar atendimento, questionário, planejamento, WhatsApp, imprimir, editar e excluir).
 * Quem recarrega a agenda, fecha o drawer ou abre a edição é a tela, pelos @Output.
 */
@Component({
  selector: 'app-agenda-drawer',
  templateUrl: './agenda-drawer.component.html',
  styleUrls: ['./agenda-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaDrawerComponent implements OnDestroy {
  @Input() consulta: Consultav2 | null = null;
  /** Controla a animação de entrada e a sombra por trás do drawer */
  @Input() aberto = false;
  @Input() usuarioLogado: Usuario = { id: 0, aud: '', exp: '', iss: '', sub: '', nome: '' };
  /** IDs das consultas com rascunho de atendimento ("Retomar" no lugar de "Iniciar") */
  @Input() consultasComRascunho = new Set<number>();
  @Input() questionariosRespondidos = new Set<number>();
  @Input() planejamentosAssinados = new Set<number>();

  /** Pede para a tela fechar o drawer */
  @Output() fechar = new EventEmitter<void>();
  /** Pede para a tela recarregar as consultas (status alterado ou consulta excluída) */
  @Output() recarregar = new EventEmitter<void>();
  /** Pede para a tela abrir a edição da consulta */
  @Output() editar = new EventEmitter<void>();

  // Mensagens de tooltip
  mensagemTooltipQuestionario = '';
  mensagemTooltipStatus = '';

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly getStatusClass = classeStatus;
  readonly getHorario = horarioLocal;
  readonly isStatusDone = etapaConcluida;

  private destroy$ = new Subject<void>();

  constructor(
    private notificacao: NotificacaoService,
    private consultaService: ConsultaApiService,
    private prontuarioState: ProntuarioStateService,
    public controleAcesso: ControleAcessoApiService,
    private cdr: ChangeDetectorRef,
    private relatorioService: RelatorioService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService,
    private acoesConsulta: AcoesConsultaService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fecharPopover(): void {
    this.fechar.emit();
  }

  abrirEdicao(): void {
    this.editar.emit();
  }

  podeVerTodosProfissionais(): boolean {
    return this.controleAcesso.isAdmin() || this.controleAcesso.isRecepcionista();
  }

  /**
   * Define se o botao de edicao da consulta deve ser exibido no drawer.
   * Consultas confirmadas nao podem ser editadas por clinico ou gestor.
   *
   * @param status status atual da consulta
   * @returns true quando a edicao e permitida para o perfil logado
   */
  podeEditarConsulta(status: string): boolean {
    return podeEditarConsultaPorPerfil(status, this.controleAcesso.isAdmin(), this.controleAcesso.isProfissional());
  }

  /** A consulta já tem um atendimento em andamento (rascunho salvo)? */
  temRascunho(consulta: Consultav2 | null | undefined): boolean {
    return temRascunho(this.consultasComRascunho, consulta);
  }

  // ========== AÇÕES ==========

  alterarStatusDrawer(novoStatus: string): void {
    const c = this.consulta;
    if (!c || novoStatus === c.status) return;

    this.consultaService.alterarStatusConsulta(c.id, novoStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensagemTooltipStatus = `Status alterado para ${this.STATUS_LABELS[novoStatus]}`;
          this.cdr.markForCheck();
          this.fecharPopover();
          this.recarregar.emit();
          setTimeout(() => {
            this.mensagemTooltipStatus = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (erro) => {
          this.mensagemTooltipStatus = extrairMensagemErro(erro) || 'Erro ao alterar status';
          this.cdr.markForCheck();
          setTimeout(() => {
            this.mensagemTooltipStatus = '';
            this.cdr.markForCheck();
          }, 3000);
        }
      });
  }

  deletarConsultaDrawer(): void {
    const c = this.consulta;
    if (!c) return;
    this.notificacao.fire({
      title: 'Confirmar exclusão',
      text: `Deseja excluir a consulta de ${c.pacienteNome}? O questionário de saúde será excluído.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir', cancelButtonText: 'Cancelar',
    }).then(r => {
      if (!r.isConfirmed) return;
      this.consultaService.deletarConsulta(c.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.notificacao.fire('Deletado', 'Consulta deletada com sucesso.', 'success'); this.fecharPopover(); this.recarregar.emit(); },
          error: (err: any) => {
            if (err?.status === 409) this.notificacao.fire('Exclusão bloqueada', 'Esta consulta possui prontuário clínico e não pode ser excluída. Os dados clínicos devem ser preservados.', 'info');
            else this.notificacao.fire('Erro', 'Erro ao deletar consulta.', 'error');
          },
        });
    });
  }

  abrirImpressaoDrawer(): void {
    if (!this.consulta) return;
    const consulta = this.consulta;
    this.fecharPopover();
    setTimeout(() => {
      this.relatorioService.abrirRelatorioAdmin(consulta);
    }, 100);
  }

  iniciarConsultaDrawer(): void {
    if (!this.consulta) return;

    const element = this.consulta;
    const retomando = this.temRascunho(element);
    const dataFormatada = element.dataHora
      ? new Date(element.dataHora).toLocaleDateString('pt-BR')
      : 'Não informada';
    const horarioFormatado = element.dataHora
      ? new Date(element.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Não informado';

    // Fechar o drawer antes de abrir o SweetAlert para evitar conflito de z-index
    this.fecharPopover();

    setTimeout(() => {
      this.notificacao.fire({
        title: retomando ? 'Retomar Atendimento' : 'Iniciar Atendimento',
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
            Deseja ${retomando ? 'retomar' : 'iniciar'} o atendimento deste paciente?
          </p>
        `,
        showCancelButton: true,
        confirmButtonColor: '#5ccf6c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: retomando
          ? '<i class="fa-solid fa-rotate-right"></i> Retomar Atendimento'
          : '<i class="fa-solid fa-stethoscope"></i> Iniciar Atendimento',
        cancelButtonText: '<i class="fa-solid fa-times"></i> Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.notificacao.fire({
            title: 'Iniciando consulta...',
            html: 'Aguarde enquanto preparamos o prontuário.',
            allowOutsideClick: false,
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: () => { this.notificacao.mostrarCarregando(); },
          }).then(() => {
            this.prontuarioState.changeConsulta(element);
            if (this.usuarioLogado.tipoProfissional === 'MEDICO') {
              this.router.navigate(['startconsulta', element.id]);
            } else if (this.usuarioLogado.tipoProfissional === 'DENTISTA') {
              this.router.navigate(['startconsulta-dentista', element.id]);
            }
          });
        }
      });
    }, 300);
  }

  gerarWhatsAppDrawer(): string {
    return this.acoesConsulta.gerarLinkWhatsApp(this.consulta);
  }

  // ========== QUESTIONÁRIO E PLANEJAMENTO ==========

  gerarLinkQuestionarioDrawer(): void {
    const element = this.consulta;
    if (!element?.id) return;
    this.prontuarioDentistaApiService.buscarQuestionarioSaude(element.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp?.respondido) {
            this.questionariosRespondidos.add(element.id);
            this.cdr.markForCheck();
            return;
          }
          this.executarGeracaoLinkQuestionario(element);
        },
        error: () => this.executarGeracaoLinkQuestionario(element)
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
            this.mensagemTooltipQuestionario = 'Link copiado para a área de transferência!';
            this.cdr.markForCheck();
            setTimeout(() => {
              this.mensagemTooltipQuestionario = '';
              this.cdr.markForCheck();
            }, 3000);
          }).catch(() => {
            this.mensagemTooltipQuestionario = 'Não foi possível copiar automaticamente';
            this.cdr.markForCheck();
            setTimeout(() => {
              this.mensagemTooltipQuestionario = '';
              this.cdr.markForCheck();
            }, 3000);
          });
        },
        error: () => {
          this.mensagemTooltipQuestionario = 'Erro ao gerar link';
          this.cdr.markForCheck();
          setTimeout(() => {
            this.mensagemTooltipQuestionario = '';
            this.cdr.markForCheck();
          }, 3000);
        }
      });
  }

  gerarLinkPlanejamentoDrawer(): void {
    const element = this.consulta;
    if (!element?.id) return;
    const tipoProfissional = this.relatorioService.detectarTipoProfissional(element);
    this.acoesConsulta.buscarProntuarioMaisRecente(element)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario: any) => {
          const codigoProntuario = this.acoesConsulta.extrairCodigoProntuario(prontuario);
          if (!codigoProntuario) {
            this.notificacao.fire('Aviso', 'Nenhum prontuário encontrado para esta consulta.', 'warning');
            return;
          }
          const plans = prontuario?.planejamentosTerapeuticos || prontuario?.planejamentos || [];
          if (plans.length > 0 && plans.every((p: any) => p.statusAssinatura === 'ASSINADO')) {
            this.planejamentosAssinados.add(element.id);
            this.cdr.markForCheck();
            this.notificacao.fire('Aviso', 'Todos os itens do planejamento já foram assinados pelo paciente.', 'info');
            return;
          }
          this.planejamentoApi.gerarLinkAssinatura(codigoProntuario, tipoProfissional)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (resp) => {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/#/assinatura-planejamento/${resp.token}`;
                navigator.clipboard.writeText(link).catch(() => {});
                this.notificacao.fire({
                  icon: 'success', title: 'Link Gerado!',
                  html: `<p style="font-size:0.9rem;">Copie o link abaixo e envie ao paciente:</p>
                         <input type="text" value="${link}" readonly
                           style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:8px;font-size:0.82rem;" />`,
                  confirmButtonText: 'OK'
                });
              },
              error: () => this.notificacao.fire('Erro', 'Não foi possível gerar o link do planejamento.', 'error')
            });
        },
        error: () => this.notificacao.fire('Erro', 'Não foi possível buscar o prontuário desta consulta.', 'error')
      });
  }
}
