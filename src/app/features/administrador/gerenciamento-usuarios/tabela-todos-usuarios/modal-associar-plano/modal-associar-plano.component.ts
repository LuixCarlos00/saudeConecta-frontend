import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { PlanoAssinatura, AssinaturaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
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

  constructor(
    public dialogRef: MatDialogRef<ModalAssociarPlanoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { organizacaoId: number; nomeOrganizacao: string },
    private planoApiService: PlanoApiService,
    private assinaturaApiService: AssinaturaApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarDados();
    console.log(this.data);
  }

  carregarDados(): void {
    this.isLoading = true;
    
    forkJoin({
      planos: this.planoApiService.listarPlanosAtivos(),
      assinaturas: this.assinaturaApiService.listarPorOrganizacao(this.data.organizacaoId)
    }).subscribe({
      next: ({ planos, assinaturas }) => {
        this.planos = planos;
        console.log('Assinaturas recebidas:', assinaturas);
        
        // Verifica se realmente existe assinatura ativa
        if (assinaturas && Array.isArray(assinaturas) && assinaturas.length > 0) {
          const assinaturaAtiva = assinaturas.find(a => 
            a.status === 'TRIAL' || a.status === 'ATIVA' || a.status === 'INADIMPLENTE'
          );
          
          if (assinaturaAtiva) {
            this.assinaturaAtual = assinaturaAtiva;
            this.planoSelecionado = this.assinaturaAtual.planoId;
            this.planoAtualNome = this.assinaturaAtual.planoNome;
            this.modoEdicao = true;
            console.log('Modo edição ativado. Plano atual:', this.planoAtualNome);
          }
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.snackBar.open('Erro ao carregar dados', 'Fechar', { duration: 3000 });
        this.isLoading = false;
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
    
    // SUPER_ADMIN sempre usa assinarPlano (passa organizacaoId explicitamente)
    // porque não tem TenantContext. O backend trata a duplicação.
    console.log('Associando plano:', this.planoSelecionado, 'para organização:', this.data.organizacaoId);
    
    this.assinaturaApiService.assinarPlano(this.data.organizacaoId, this.planoSelecionado).subscribe({
      next: (assinatura) => {
        const msg = this.modoEdicao ? 'Plano alterado com sucesso!' : 'Plano associado com sucesso!';
        this.snackBar.open(msg, 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Erro ao associar plano:', err);
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
}
