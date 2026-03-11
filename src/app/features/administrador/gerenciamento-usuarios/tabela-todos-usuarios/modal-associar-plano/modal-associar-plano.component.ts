import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { CobrancaApiService } from 'src/app/services/api/cobranca-api.service';
import { PlanoAssinatura, AssinaturaTenant, CobrancaTenant, CustomizarPlanoTenantRequest } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-associar-plano',
  templateUrl: './modal-associar-plano.component.html',
  styleUrls: ['./modal-associar-plano.component.css']
})
export class ModalAssociarPlanoComponent implements OnInit {

  planos: PlanoAssinatura[] = [];
  planoSelecionado: number | null = null;
  assinaturaAtual: AssinaturaTenant | null = null;
  planoAtualNome: string = '';
  isLoading = true;
  isSaving = false;
  modoEdicao = false;

  cobrancas: CobrancaTenant[] = [];
  isLoadingCobrancas = false;
  confirmandoId: number | null = null;

  // Personalização
  customLimiteAdmin: number | null = null;
  customLimiteProf: number | null = null;
  customLimiteSec: number | null = null;
  isSavingCustom = false;
  planoAtual: PlanoAssinatura | null = null;

  // Valores calculados (atualizados via onLimiteChange)
  extraAdmin = 0;
  extraProf = 0;
  extraSec = 0;
  custoExtraAdmin = 0;
  custoExtraProf = 0;
  custoExtraSec = 0;
  valorAdicionalTotal = 0;
  valorTotalMensal = 0;

  tabAtiva = 0;

  constructor(
    public dialogRef: MatDialogRef<ModalAssociarPlanoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { organizacaoId: number; nomeOrganizacao: string },
    private planoApiService: PlanoApiService,
    private assinaturaApiService: AssinaturaApiService,
    private cobrancaApiService: CobrancaApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.isLoading = true;

    forkJoin({
      planos: this.planoApiService.listarPlanosAtivos(),
      assinaturas: this.assinaturaApiService.listarPorOrganizacao(this.data.organizacaoId)
    }).subscribe({
      next: ({ planos, assinaturas }) => {
        this.planos = planos;

        if (assinaturas && Array.isArray(assinaturas) && assinaturas.length > 0) {
          const assinaturaAtiva = assinaturas.find(a =>
            a.status === 'TRIAL' || a.status === 'ATIVA' || a.status === 'INADIMPLENTE'
          );

          if (assinaturaAtiva) {
            this.assinaturaAtual = assinaturaAtiva;
            this.planoSelecionado = this.assinaturaAtual.planoId;
            this.planoAtualNome = this.assinaturaAtual.planoNome;
            this.modoEdicao = true;

            this.planoAtual = this.planos.find(p => p.id === assinaturaAtiva.planoId) || null;
            this.customLimiteAdmin = assinaturaAtiva.limiteAdminOrgCustom ?? this.planoAtual?.limiteAdminOrg ?? null;
            this.customLimiteProf = assinaturaAtiva.limiteProfissionalCustom ?? this.planoAtual?.limiteProfissional ?? null;
            this.customLimiteSec = assinaturaAtiva.limiteSecretariaCustom ?? this.planoAtual?.limiteSecretaria ?? null;
            this.recalcularExtras();
          }
        }

        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar dados', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Carrega cobranças da organização ao trocar para a aba de cobranças.
   */
  onTabChange(index: number): void {
    this.tabAtiva = index;
    if (index === 1 && this.cobrancas.length === 0) {
      this.carregarCobrancas();
    }
  }

  carregarCobrancas(): void {
    this.isLoadingCobrancas = true;
    this.cobrancaApiService.listarPorOrganizacao(this.data.organizacaoId).subscribe({
      next: (cobrancas) => {
        this.cobrancas = cobrancas;
        this.isLoadingCobrancas = false;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar cobranças', 'Fechar', { duration: 3000 });
        this.isLoadingCobrancas = false;
      }
    });
  }

  /**
   * Confirma pagamento manualmente (SuperAdmin).
   * @param cobrancaId ID da cobrança
   */
  confirmarPagamento(cobrancaId: number): void {
    this.confirmandoId = cobrancaId;
    this.cobrancaApiService.confirmarPagamento(cobrancaId).subscribe({
      next: () => {
        this.snackBar.open('Pagamento confirmado com sucesso!', 'Fechar', { duration: 3000 });
        this.confirmandoId = null;
        this.carregarCobrancas();
        this.carregarDados();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao confirmar pagamento';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        this.confirmandoId = null;
      }
    });
  }

  associarPlano(): void {
    if (!this.planoSelecionado) {
      this.snackBar.open('Selecione um plano', 'Fechar', { duration: 3000 });
      return;
    }

    if (this.modoEdicao && this.planoSelecionado === this.assinaturaAtual?.planoId) {
      this.snackBar.open('Selecione um plano diferente do atual', 'Fechar', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    this.assinaturaApiService.assinarPlano(this.data.organizacaoId, this.planoSelecionado).subscribe({
      next: () => {
        const msg = this.modoEdicao ? 'Plano alterado com sucesso!' : 'Plano associado com sucesso!';
        this.snackBar.open(msg, 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const msg = err.error?.message || (this.modoEdicao ? 'Erro ao alterar plano' : 'Erro ao associar plano');
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        this.isSaving = false;
      }
    });
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  formatarValor(valor: number): string {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Ilimitado' : `${limite}`;
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
      'EXPIRADO': 'status-expirado'
    };
    return classes[status] || '';
  }

  get cobrancasPendentes(): CobrancaTenant[] {
    return this.cobrancas.filter(c => c.status === 'PENDENTE');
  }

  /**
   * Chamado pelo (ngModelChange) de cada input de limite.
   * Recalcula todos os extras e valores derivados.
   */
  onLimiteChange(): void {
    this.recalcularExtras();
  }

  /**
   * Recalcula quantidade de extras e custos para cada perfil.
   */
  private recalcularExtras(): void {
    if (!this.planoAtual) return;

    this.extraAdmin = this.calcularExtra(this.customLimiteAdmin, this.planoAtual.limiteAdminOrg);
    this.extraProf = this.calcularExtra(this.customLimiteProf, this.planoAtual.limiteProfissional);
    this.extraSec = this.calcularExtra(this.customLimiteSec, this.planoAtual.limiteSecretaria);

    this.custoExtraAdmin = this.extraAdmin * (this.planoAtual.valorAdicionalAdmin || 0);
    this.custoExtraProf = this.extraProf * (this.planoAtual.valorAdicionalProfissional || 0);
    this.custoExtraSec = this.extraSec * (this.planoAtual.valorAdicionalSecretaria || 0);

    this.valorAdicionalTotal = this.custoExtraAdmin + this.custoExtraProf + this.custoExtraSec;
    this.valorTotalMensal = this.planoAtual.valorMensal + this.valorAdicionalTotal;
  }

  /**
   * Calcula a quantidade de perfis extras em relação ao limite base do plano.
   * @param limiteCustom limite personalizado desejado
   * @param limitePlano limite padrão do plano
   * @returns quantidade de extras (>= 0)
   */
  private calcularExtra(limiteCustom: number | null, limitePlano: number | null): number {
    if (limiteCustom == null || limitePlano == null) return 0;
    return Math.max(0, Number(limiteCustom) - Number(limitePlano));
  }

  /**
   * Salva a customização dos limites do plano para o tenant (SUPER_ADMIN).
   */
  salvarCustomizacao(): void {
    this.isSavingCustom = true;
    const request: CustomizarPlanoTenantRequest = {
      limiteAdminOrgCustom: this.customLimiteAdmin != null ? Number(this.customLimiteAdmin) : null,
      limiteProfissionalCustom: this.customLimiteProf != null ? Number(this.customLimiteProf) : null,
      limiteSecretariaCustom: this.customLimiteSec != null ? Number(this.customLimiteSec) : null
    };

    this.assinaturaApiService.customizarPlano(this.data.organizacaoId, request).subscribe({
      next: (res) => {
        this.isSavingCustom = false;
        Swal.fire({
          icon: 'success',
          title: 'Plano personalizado!',
          text: `Limites atualizados com sucesso. Novo valor mensal: R$ ${res.valorMensal?.toFixed(2) || '—'}`,
          timer: 4000,
          showConfirmButton: true
        });
        this.carregarDados();
      },
      error: (err) => {
        console.error('Erro ao customizar plano:', err);
        this.isSavingCustom = false;
        const msg = err.error?.message || err.message || 'Erro ao personalizar plano';
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: msg
        });
      }
    });
  }
}
