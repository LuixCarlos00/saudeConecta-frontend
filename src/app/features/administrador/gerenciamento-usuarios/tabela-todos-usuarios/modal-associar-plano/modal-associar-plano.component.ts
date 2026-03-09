import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { CobrancaApiService } from 'src/app/services/api/cobranca-api.service';
import { PlanoAssinatura, AssinaturaTenant, CobrancaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { forkJoin } from 'rxjs';

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
}
