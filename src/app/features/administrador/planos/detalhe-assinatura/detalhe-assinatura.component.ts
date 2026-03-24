import { Component, OnInit } from '@angular/core';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { CobrancaApiService } from 'src/app/services/api/cobranca-api.service';
import { AssinaturaTenant, CobrancaTenant, LimitesPlano } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalPixComponent } from '../modal-pix/modal-pix.component';

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
  gerandoCobranca = false;

  constructor(
    private assinaturaApiService: AssinaturaApiService,
    private cobrancaApiService: CobrancaApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
        this.carregarCobrancas();
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

  private carregarCobrancas(): void {
    this.cobrancaApiService.listarMinhasCobrancas().subscribe({
      next: (cobrancas) => {
        this.cobrancas = cobrancas;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  get possuiCobrancaPendente(): boolean {
    return this.cobrancas.some(c => c.status === 'PENDENTE');
  }

  gerarCobranca(): void {
    if (!this.assinatura || this.gerandoCobranca) return;

    this.gerandoCobranca = true;
    this.cobrancaApiService.gerarCobranca(this.assinatura.id).subscribe({
      next: (cobranca) => {
        this.gerandoCobranca = false;
        this.abrirModalPix(cobranca);
        this.carregarCobrancas();
      },
      error: (err) => {
        this.gerandoCobranca = false;
        const msg = err.error?.message || 'Erro ao gerar cobrança';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }

  abrirModalPix(cobranca: CobrancaTenant): void {
    this.dialog.open(ModalPixComponent, {
      width: '500px',
      data: cobranca
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
}
