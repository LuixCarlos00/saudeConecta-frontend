import { Component, OnInit } from '@angular/core';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { PlanoAssinatura, AssinaturaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lista-planos',
  templateUrl: './lista-planos.component.html',
  styleUrls: ['./lista-planos.component.css']
})
export class ListaPlanosComponent implements OnInit {

  planos: PlanoAssinatura[] = [];
  assinaturaAtiva: AssinaturaTenant | null = null;
  isLoading = true;
  planoSelecionado: PlanoAssinatura | null = null;

  constructor(
    private planoApiService: PlanoApiService,
    private assinaturaApiService: AssinaturaApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.isLoading = true;
    this.planoApiService.listarPlanosAtivos().subscribe({
      next: (planos) => {
        this.planos = planos;
        this.carregarAssinaturaAtiva();
      },
      error: () => {
        this.snackBar.open('Erro ao carregar planos', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private carregarAssinaturaAtiva(): void {
    this.assinaturaApiService.minhaAssinatura().subscribe({
      next: (assinatura) => {
        this.assinaturaAtiva = assinatura;
        this.isLoading = false;
      },
      error: () => {
        this.assinaturaAtiva = null;
        this.isLoading = false;
      }
    });
  }

  isPlanoAtual(plano: PlanoAssinatura): boolean {
    return this.assinaturaAtiva?.planoId === plano.id;
  }

  selecionarPlano(plano: PlanoAssinatura): void {
    if (this.isPlanoAtual(plano)) return;
    this.planoSelecionado = plano;
  }

  assinarPlano(plano: PlanoAssinatura): void {
    if (!this.assinaturaAtiva) {
      this.snackBar.open('Nenhuma assinatura ativa encontrada', 'Fechar', { duration: 3000 });
      return;
    }

    this.assinaturaApiService.trocarPlano(plano.id).subscribe({
      next: (assinatura) => {
        this.assinaturaAtiva = assinatura;
        this.planoSelecionado = null;
        this.snackBar.open(`Plano alterado para ${plano.nome}!`, 'Fechar', { duration: 3000 });
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao trocar plano';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }

  formatarValor(valor: number): string {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Ilimitado' : `${limite}`;
  }
}
