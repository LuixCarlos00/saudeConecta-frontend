import { Component, OnInit } from '@angular/core';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { AssinaturaTenant, CobrancaTenant, LimitesPlano } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { diasCalendarioAte, formatarDataBr } from 'src/app/shared/utils/data-local';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalhe-assinatura',
  templateUrl: './detalhe-assinatura.component.html',
  styleUrls: ['./detalhe-assinatura.component.css']
})
export class DetalheAssinaturaComponent implements OnInit {

  assinatura: AssinaturaTenant | null = null;
  limites: LimitesPlano | null = null;
  cobrancas: CobrancaTenant[] = [];
  isLoading = true;
  gerandoLink = false;
  cancelando = false;

  constructor(
    private assinaturaApiService: AssinaturaApiService,
    private controleAcesso: ControleAcessoApiService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.isLoading = true;

    this.assinaturaApiService.minhaAssinatura().subscribe({
      next: (assinatura) => {
        this.assinatura = assinatura;
        this.carregarLimites();
        this.carregarHistorico();
      },
      error: () => {
        this.assinatura = null;
        this.isLoading = false;
      }
    });
  }

  private carregarLimites(): void {
    this.assinaturaApiService.obterLimites().subscribe({
      next: (limites) => this.limites = limites,
      error: () => this.limites = null
    });
  }

  private carregarHistorico(): void {
    this.assinaturaApiService.historico().subscribe({
      next: (cobrancas) => {
        this.cobrancas = cobrancas;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  /** Assinatura ainda em período gratuito, aguardando cadastro do cartão. */
  get emTrial(): boolean {
    return this.assinatura?.status === 'TRIAL' && !this.assinatura?.cortesia;
  }

  /** Assinatura isenta de cobrança, liberada manualmente pelo suporte. */
  get isCortesia(): boolean {
    return !!this.assinatura?.cortesia;
  }

  /**
   * Pagar e cancelar exigem ROLE_ADMIN no back (gerar-link-pagamento e DELETE minha-assinatura);
   * a Secretária só visualiza a tela (senão levaria 403).
   */
  get podeGerenciarPagamento(): boolean {
    return this.controleAcesso.podeGerenciarAdministrador();
  }

  /** Estado da assinatura permite ativar/pagar (independente de quem está logado). */
  private get statusPermiteAtivar(): boolean {
    if (!this.assinatura || this.isCortesia) return false;
    return ['TRIAL', 'INADIMPLENTE', 'SUSPENSA'].includes(this.assinatura.status);
  }

  /** Permite ativar enquanto a cobrança automática ainda não estiver vigente. */
  get podeAtivar(): boolean {
    return this.podeGerenciarPagamento && this.statusPermiteAtivar;
  }

  /** Só faz sentido cancelar uma assinatura que ainda dá acesso ao sistema. */
  get podeCancelar(): boolean {
    if (!this.podeGerenciarPagamento || !this.assinatura || this.isCortesia) return false;
    return this.assinatura.status !== 'CANCELADA';
  }

  /** Secretária diante de uma assinatura que precisa de pagamento: orientar a falar com o gestor. */
  get avisoSomenteLeitura(): boolean {
    return !this.podeGerenciarPagamento && this.statusPermiteAtivar;
  }

  get diasRestantesTrial(): number {
    if (!this.assinatura?.dataVencimento) return 0;
    return Math.max(0, diasCalendarioAte(this.assinatura.dataVencimento));
  }

  /**
   * Gera o link do checkout hospedado do Mercado Pago e abre em nova aba.
   * Antes de redirecionar, avisa que o pagamento precisa ser feito com a conta
   * Mercado Pago vinculada ao e-mail do administrador — caso contrário o
   * Mercado Pago recusa o pagamento.
   */
  ativarAssinatura(): void {
    if (this.gerandoLink) return;

    this.gerandoLink = true;
    this.assinaturaApiService.gerarLinkPagamento().subscribe({
      next: (link) => {
        this.gerandoLink = false;
        Swal.fire({
          icon: 'info',
          title: 'Atenção ao e-mail do pagamento',
          html: `Use a conta Mercado Pago vinculada ao e-mail <strong>${link.payerEmail}</strong>.<br>
                 Pagamentos feitos com outra conta serão recusados pelo Mercado Pago.`,
          confirmButtonText: 'Continuar para o pagamento',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        }).then(resultado => {
          if (resultado.isConfirmed) {
            window.open(link.initPoint, '_blank');
            this.carregarDados();
          }
        });
      },
      error: (err) => {
        this.gerandoLink = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: err.error?.message || 'Não foi possível gerar o link de pagamento.'
        });
      }
    });
  }

  /**
   * Cancela a assinatura com dupla confirmação, deixando claro que o acesso
   * permanece até o fim do período já pago.
   */
  cancelarAssinatura(): void {
    if (this.cancelando) return;

    Swal.fire({
      icon: 'warning',
      title: 'Cancelar assinatura?',
      html: `A cobrança automática será encerrada no Mercado Pago.<br>
             Seu acesso continua até <strong>${this.formatarData(this.assinatura?.dataVencimento)}</strong>.`,
      showCancelButton: true,
      confirmButtonText: 'Sim, quero cancelar',
      cancelButtonText: 'Voltar',
      confirmButtonColor: '#d33'
    }).then(primeira => {
      if (!primeira.isConfirmed) return;

      Swal.fire({
        icon: 'warning',
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita. Para voltar a usar o sistema você precisará assinar novamente.',
        showCancelButton: true,
        confirmButtonText: 'Confirmar cancelamento',
        cancelButtonText: 'Voltar',
        confirmButtonColor: '#d33'
      }).then(segunda => {
        if (segunda.isConfirmed) {
          this.executarCancelamento();
        }
      });
    });
  }

  private executarCancelamento(): void {
    this.cancelando = true;
    this.assinaturaApiService.cancelarMinhaAssinatura().subscribe({
      next: () => {
        this.cancelando = false;
        Swal.fire({
          icon: 'success',
          title: 'Assinatura cancelada',
          text: 'A cobrança automática foi encerrada.'
        }).then(() => this.carregarDados());
      },
      error: (err) => {
        this.cancelando = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: err.error?.message || 'Não foi possível cancelar a assinatura.'
        });
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'TRIAL': 'status-trial',
      'ATIVA': 'status-ativa',
      'INADIMPLENTE': 'status-inadimplente',
      'SUSPENSA': 'status-suspensa',
      'CANCELADA': 'status-cancelada',
      'PENDENTE': 'status-pendente',
      'PAGO': 'status-pago',
      'RECUSADO': 'status-inadimplente',
      'EXPIRADO': 'status-expirado'
    };
    return classes[status] || '';
  }

  calcularPercentual(usado: number, limite: number | null): number {
    if (limite === null || limite === 0) return 0;
    return Math.min((usado / limite) * 100, 100);
  }

  formatarValor(valor: number): string {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Ilimitado' : `${limite}`;
  }

  private formatarData(data: string | null | undefined): string {
    return formatarDataBr(data, 'o fim do período atual');
  }
}
