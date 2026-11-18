import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { PlanoAssinatura, PlanoAssinaturaRequest } from 'src/app/shared/models/PlanoAssinatura';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { mensagemErroAssinaturaAdmin } from 'src/app/shared/utils/mensagem-erro-http';

/** Campo de valor por usuário extra no plano. */
export type CampoAdicional = 'valorAdicionalAdmin' | 'valorAdicionalProfissional' | 'valorAdicionalSecretaria';

/**
 * Diálogo que mostra, numa tabela única, quanto cada plano cobra por usuário extra de cada perfil.
 * Só envia ao back os planos que tiveram algum valor alterado. Fecha com `true` quando salvou.
 */
@Component({
  selector: 'app-modal-valores-adicionais',
  templateUrl: './modal-valores-adicionais.component.html',
  styleUrls: ['../../../tokens-assinatura.css', '../../../components/dialogo-assinatura.css', './modal-valores-adicionais.component.css']
})
export class ModalValoresAdicionaisComponent {

  readonly perfis: { campo: CampoAdicional; rotulo: string }[] = [
    { campo: 'valorAdicionalAdmin', rotulo: 'Administrador' },
    { campo: 'valorAdicionalProfissional', rotulo: 'Profissional' },
    { campo: 'valorAdicionalSecretaria', rotulo: 'Secretária' }
  ];

  planos: PlanoAssinatura[] = [];
  /** Valores em edição por plano. Começam iguais aos do plano. */
  valores = new Map<number, Record<CampoAdicional, number | null>>();
  salvando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalValoresAdicionaisComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { planos: PlanoAssinatura[] },
    private planoApiService: PlanoApiService,
    private snackBar: MatSnackBar
  ) {
    this.planos = data.planos;
    this.planos.forEach(p => this.valores.set(p.id, {
      valorAdicionalAdmin: p.valorAdicionalAdmin,
      valorAdicionalProfissional: p.valorAdicionalProfissional,
      valorAdicionalSecretaria: p.valorAdicionalSecretaria
    }));
  }

  /**
   * Valor em edição de uma célula.
   * @param plano coluna
   * @param campo linha
   * @returns valor atual
   */
  valor(plano: PlanoAssinatura, campo: CampoAdicional): number | null {
    return this.valores.get(plano.id)![campo];
  }

  /**
   * Grava o que foi digitado numa célula. Campo vazio vira null (sem cobrança extra definida).
   * @param plano coluna
   * @param campo linha
   * @param valor valor digitado
   */
  definir(plano: PlanoAssinatura, campo: CampoAdicional, valor: number | string | null): void {
    const numero = valor === '' || valor === null || valor === undefined ? null : Number(valor);
    this.valores.get(plano.id)![campo] = numero;
  }

  /**
   * A célula está diferente do valor salvo?
   * @param plano coluna
   * @param campo linha
   * @returns true se foi alterada
   */
  alterado(plano: PlanoAssinatura, campo: CampoAdicional): boolean {
    return this.valor(plano, campo) !== plano[campo];
  }

  /** A célula tem valor negativo? */
  negativo(plano: PlanoAssinatura, campo: CampoAdicional): boolean {
    const v = this.valor(plano, campo);
    return v !== null && v < 0;
  }

  /** Planos com pelo menos um valor alterado. */
  get planosAlterados(): PlanoAssinatura[] {
    return this.planos.filter(p => this.perfis.some(({ campo }) => this.alterado(p, campo)));
  }

  /** Algum valor negativo impede salvar. */
  get temErro(): boolean {
    return this.planos.some(p => this.perfis.some(({ campo }) => this.negativo(p, campo)));
  }

  salvar(): void {
    const alterados = this.planosAlterados;
    if (alterados.length === 0 || this.temErro) { return; }

    this.salvando = true;
    forkJoin(alterados.map(plano => this.planoApiService.atualizarPlano(plano.id, this.montarRequest(plano)))).subscribe({
      next: () => {
        const n = alterados.length;
        this.snackBar.open(n === 1 ? 'Valores do plano atualizados.' : `Valores de ${n} planos atualizados.`, 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        // Alguns planos podem ter salvado antes do erro: fecha com true para a tela recarregar o que vale agora
        this.salvando = false;
        this.snackBar.open(mensagemErroAssinaturaAdmin(err, 'Não foi possível salvar todos os valores. Confira e tente de novo.'), 'Fechar', { duration: 5000 });
        this.dialogRef.close(true);
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  private montarRequest(plano: PlanoAssinatura): PlanoAssinaturaRequest {
    const v = this.valores.get(plano.id)!;
    return {
      nome: plano.nome,
      descricao: plano.descricao,
      titulo: plano.titulo,
      recursos: plano.recursos,
      tipo: plano.tipo,
      valorMensal: plano.valorMensal,
      limiteAdminOrg: plano.limiteAdminOrg,
      limiteProfissional: plano.limiteProfissional,
      limiteSecretaria: plano.limiteSecretaria,
      valorAdicionalAdmin: v.valorAdicionalAdmin,
      valorAdicionalProfissional: v.valorAdicionalProfissional,
      valorAdicionalSecretaria: v.valorAdicionalSecretaria
    };
  }
}
