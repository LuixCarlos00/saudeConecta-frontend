import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlanoAssinatura } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { PlanoAssinaturaRequest } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-modal-valores-adicionais',
  templateUrl: './modal-valores-adicionais.component.html',
  styleUrls: ['./modal-valores-adicionais.component.css']
})
export class ModalValoresAdicionaisComponent {
  planos: PlanoAssinatura[] = [];
  valoresTemp: Map<number, any> = new Map();

  constructor(
    public dialogRef: MatDialogRef<ModalValoresAdicionaisComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { planos: PlanoAssinatura[] },
    private planoApiService: PlanoApiService,
    private snackBar: MatSnackBar
  ) {
    this.planos = data.planos;
    this.inicializarValoresTemp();
  }

  inicializarValoresTemp(): void {
    this.valoresTemp.clear();
    this.planos.forEach(plano => {
      this.valoresTemp.set(plano.id, {
        valorAdicionalAdmin: plano.valorAdicionalAdmin,
        valorAdicionalProfissional: plano.valorAdicionalProfissional,
        valorAdicionalSecretaria: plano.valorAdicionalSecretaria
      });
    });
  }

  atualizarValor(planoId: number, tipo: string, event: Event): void {
    const planoValores = this.valoresTemp.get(planoId);
    if (planoValores && event.target) {
      const inputElement = event.target as HTMLInputElement;
      const valorNumerico = parseFloat(inputElement.value) || 0;
      if (tipo === 'admin') {
        planoValores.valorAdicionalAdmin = valorNumerico;
      } else if (tipo === 'profissional') {
        planoValores.valorAdicionalProfissional = valorNumerico;
      } else if (tipo === 'secretaria') {
        planoValores.valorAdicionalSecretaria = valorNumerico;
      }
      this.valoresTemp.set(planoId, planoValores);
    }
  }

  salvar(): void {
    let planosAtualizados = 0;
    let totalPlanos = this.valoresTemp.size;

    this.valoresTemp.forEach((valores, planoId) => {
      const plano = this.planos.find(p => p.id === planoId);
      if (plano) {
        const request: PlanoAssinaturaRequest = {
          nome: plano.nome,
          descricao: plano.descricao,
          titulo: plano.titulo,
          recursos: plano.recursos,
          tipo: plano.tipo,
          valorMensal: plano.valorMensal,
          limiteAdminOrg: plano.limiteAdminOrg,
          limiteProfissional: plano.limiteProfissional,
          limiteSecretaria: plano.limiteSecretaria,
          valorAdicionalAdmin: valores.valorAdicionalAdmin,
          valorAdicionalProfissional: valores.valorAdicionalProfissional,
          valorAdicionalSecretaria: valores.valorAdicionalSecretaria
        };

        this.planoApiService.atualizarPlano(planoId, request).subscribe({
          next: () => {
            planosAtualizados++;
            plano.valorAdicionalAdmin = valores.valorAdicionalAdmin;
            plano.valorAdicionalProfissional = valores.valorAdicionalProfissional;
            plano.valorAdicionalSecretaria = valores.valorAdicionalSecretaria;

            if (planosAtualizados === totalPlanos) {
              this.snackBar.open('Valores adicionais atualizados com sucesso!', 'Fechar', { duration: 3000 });
              this.dialogRef.close(true);
            }
          },
          error: (error) => {
            console.error('Erro ao atualizar valores adicionais do plano:', error);
            this.snackBar.open('Erro ao atualizar valores', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
