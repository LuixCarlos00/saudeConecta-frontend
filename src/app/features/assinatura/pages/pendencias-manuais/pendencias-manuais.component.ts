import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { AssinaturaAdminApiService, PendenciaManual } from 'src/app/features/assinatura/data-access/assinatura-admin-api.service';
import { formatarDataBr } from 'src/app/shared/utils/data-local';
import { extrairCodigoErro, mensagemErroAssinaturaAdmin } from 'src/app/shared/utils/mensagem-erro-http';
import { DescricaoMotivoPendencia, descreverMotivoPendencia, MOTIVOS_PENDENCIA } from './pendencias-motivos';

/** Limite de caracteres da observação (contrato admin-assinaturas, seção 3.2). */
export const LIMITE_OBSERVACAO = 500;

/**
 * Pendências manuais de pagamento do SUPER_ADMIN: eventos do Mercado Pago que exigem ação humana.
 * Alterna entre abertas e resolvidas; "Resolver" só registra a resolução (o estorno é feito no painel do MP).
 */
@Component({
  selector: 'app-pendencias-manuais',
  templateUrl: './pendencias-manuais.component.html',
  styleUrls: ['./pendencias-manuais.component.css']
})
export class PendenciasManuaisComponent implements OnInit, OnDestroy {

  readonly limiteObservacao = LIMITE_OBSERVACAO;
  readonly legenda = Object.entries(MOTIVOS_PENDENCIA).map(([codigo, d]) => ({ codigo, ...d }));
  readonly formatarData = (data: string | null) => formatarDataBr(data, '—');

  mostrarResolvidas = false;
  pendencias: PendenciaManual[] = [];
  carregando = false;
  erro: string | null = null;

  /** eventoId com o formulário de resolução aberto. */
  resolvendoId: number | null = null;
  observacao = '';
  erroObservacao: string | null = null;
  salvando = false;

  private requisicao?: Subscription;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private adminApi: AssinaturaAdminApiService,
    private notificacao: NotificacaoService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.requisicao?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Busca a lista da aba atual (abertas ou resolvidas); a resposta de uma chamada antiga é descartada. */
  carregar(): void {
    this.requisicao?.unsubscribe();
    this.carregando = true;
    this.erro = null;
    this.requisicao = this.adminApi.listarPendenciasManuais(this.mostrarResolvidas).subscribe({
      next: lista => {
        this.pendencias = lista;
        this.carregando = false;
      },
      error: err => {
        this.pendencias = [];
        this.erro = mensagemErroAssinaturaAdmin(err, 'Não foi possível carregar as pendências.');
        this.carregando = false;
      }
    });
  }

  /**
   * Troca entre abertas e resolvidas e recarrega.
   *
   * @param resolvidas true para a aba de resolvidas
   */
  alternar(resolvidas: boolean): void {
    if (resolvidas === this.mostrarResolvidas && !this.erro) { return; }
    this.mostrarResolvidas = resolvidas;
    this.cancelarResolucao();
    this.carregar();
  }

  /**
   * Abre o formulário de resolução da pendência (fecha o de outra, se houver).
   *
   * @param pendencia pendência aberta
   */
  iniciarResolucao(pendencia: PendenciaManual): void {
    this.resolvendoId = pendencia.eventoId;
    this.observacao = '';
    this.erroObservacao = null;
  }

  /** Fecha o formulário sem salvar. */
  cancelarResolucao(): void {
    this.resolvendoId = null;
    this.observacao = '';
    this.erroObservacao = null;
  }

  /** Observação aparada (o back recusa vazia; espaços não contam). */
  get observacaoAparada(): string {
    return this.observacao.trim();
  }

  /** Mensagem de validação local da observação, ou null quando está válida. */
  private validarObservacao(): string | null {
    if (!this.observacaoAparada) { return 'Descreva o que foi feito: a observação é obrigatória.'; }
    if (this.observacaoAparada.length > LIMITE_OBSERVACAO) { return `A observação aceita no máximo ${LIMITE_OBSERVACAO} caracteres.`; }
    return null;
  }

  /**
   * Envia a resolução. Validada localmente; os erros do back são tratados pelo `code`:
   * 409 PENDENCIA_JA_RESOLVIDA e 404 recarregam a lista (o estado mudou por fora), 400 VALIDACAO mostra no campo.
   *
   * @param pendencia pendência que está sendo resolvida
   */
  confirmarResolucao(pendencia: PendenciaManual): void {
    if (this.salvando) { return; }
    this.erroObservacao = this.validarObservacao();
    if (this.erroObservacao) { return; }

    this.salvando = true;
    this.adminApi.resolverPendencia(pendencia.eventoId, this.observacaoAparada).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.salvando = false;
        this.cancelarResolucao();
        this.notificacao.mostrarToast('success', 'Pendência resolvida');
        this.carregar();
      },
      error: err => {
        this.salvando = false;
        const codigo = extrairCodigoErro(err);
        const mensagem = mensagemErroAssinaturaAdmin(err, 'Não foi possível resolver a pendência.');
        if (err?.status === 400 && codigo === 'VALIDACAO') {
          this.erroObservacao = err.error?.errors?.observacao || mensagem;
          return;
        }
        this.cancelarResolucao();
        this.notificacao.showError(mensagem);
        if (err?.status === 404 || codigo === 'PENDENCIA_JA_RESOLVIDA') { this.carregar(); }
      }
    });
  }

  /**
   * Descrição amigável do motivo; null quando o código é desconhecido (a tela mostra o texto do back).
   *
   * @param pendencia pendência da lista
   */
  descricao(pendencia: PendenciaManual): DescricaoMotivoPendencia | null {
    return descreverMotivoPendencia(pendencia.motivoCodigo);
  }

  trackPorEvento(_indice: number, pendencia: PendenciaManual): number {
    return pendencia.eventoId;
  }
}
