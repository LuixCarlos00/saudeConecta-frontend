import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CobrancaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';

@Component({
  selector: 'app-modal-pix',
  templateUrl: './modal-pix.component.html',
  styleUrls: ['./modal-pix.component.css']
})
export class ModalPixComponent {

  cobranca: CobrancaTenant;

  constructor(
    public dialogRef: MatDialogRef<ModalPixComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CobrancaTenant,
    private snackBar: MatSnackBar
  ) {
    this.cobranca = data;
  }

  copiarPixCopiaECola(): void {
    if (!this.cobranca.pixCopiaECola) return;

    navigator.clipboard.writeText(this.cobranca.pixCopiaECola).then(() => {
      this.snackBar.open('Código Pix copiado!', 'Fechar', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Erro ao copiar código', 'Fechar', { duration: 3000 });
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  formatarValor(valor: number): string {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  }
}
