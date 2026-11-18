import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { PlanoAssinatura, PlanoAssinaturaRequest } from 'src/app/shared/models/PlanoAssinatura';
import { PlanoDescricaoParserService } from 'src/app/shared/utils/plano-descricao-parser.service';
import { mensagemErroAssinaturaAdmin } from 'src/app/shared/utils/mensagem-erro-http';

/** Um perfil com limite e valor por usuário extra no plano. */
interface PerfilPlano {
  rotulo: string;
  limite: 'limiteAdminOrg' | 'limiteProfissional' | 'limiteSecretaria';
  semLimite: 'semLimiteAdmin' | 'semLimiteProfissional' | 'semLimiteSecretaria';
  adicional: 'valorAdicionalAdmin' | 'valorAdicionalProfissional' | 'valorAdicionalSecretaria';
}

/**
 * Diálogo de edição de um plano de assinatura (SUPER_ADMIN).
 * Reúne nome, textos da página de planos, mensalidade, limites e valor por usuário extra.
 * Fecha com `true` quando salvou, para a tela recarregar a lista.
 */
@Component({
  selector: 'app-modal-editar-plano',
  templateUrl: './modal-editar-plano.component.html',
  styleUrls: ['../../../tokens-assinatura.css', '../../../components/dialogo-assinatura.css', './modal-editar-plano.component.css']
})
export class ModalEditarPlanoComponent {

  readonly perfis: PerfilPlano[] = [
    { rotulo: 'Administradores', limite: 'limiteAdminOrg', semLimite: 'semLimiteAdmin', adicional: 'valorAdicionalAdmin' },
    { rotulo: 'Profissionais', limite: 'limiteProfissional', semLimite: 'semLimiteProfissional', adicional: 'valorAdicionalProfissional' },
    { rotulo: 'Secretárias', limite: 'limiteSecretaria', semLimite: 'semLimiteSecretaria', adicional: 'valorAdicionalSecretaria' }
  ];

  form: FormGroup;
  salvando = false;

  constructor(
    private fb: FormBuilder,
    private planoApiService: PlanoApiService,
    private parser: PlanoDescricaoParserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ModalEditarPlanoComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { plano: PlanoAssinatura }
  ) {
    const plano = data.plano;
    const { titulo, recursos } = this.lerTextos(plano);

    this.form = this.fb.group({
      nome: [plano.nome, [Validators.required, Validators.maxLength(60)]],
      titulo: [titulo, [Validators.required, Validators.maxLength(120)]],
      recursos: [recursos.join('\n')],
      valorMensal: [plano.valorMensal, [Validators.required, Validators.min(0)]],
      limiteAdminOrg: [plano.limiteAdminOrg, [Validators.min(1)]],
      limiteProfissional: [plano.limiteProfissional, [Validators.min(1)]],
      limiteSecretaria: [plano.limiteSecretaria, [Validators.min(1)]],
      semLimiteAdmin: [plano.limiteAdminOrg === null],
      semLimiteProfissional: [plano.limiteProfissional === null],
      semLimiteSecretaria: [plano.limiteSecretaria === null],
      valorAdicionalAdmin: [plano.valorAdicionalAdmin, [Validators.min(0)]],
      valorAdicionalProfissional: [plano.valorAdicionalProfissional, [Validators.min(0)]],
      valorAdicionalSecretaria: [plano.valorAdicionalSecretaria, [Validators.min(0)]]
    });

    this.perfis.forEach(p => this.aplicarSemLimite(p, this.form.get(p.semLimite)!.value));
  }

  /** Recursos digitados, um por linha, sem linhas vazias. */
  get recursosDigitados(): string[] {
    const texto: string = this.form.get('recursos')?.value || '';
    return texto.split('\n').map(r => r.trim()).filter(r => r.length > 0);
  }

  /**
   * Liga ou desliga "sem limite" de um perfil: desabilita o número e limpa o valor.
   * @param perfil perfil afetado
   * @param semLimite true para ilimitado
   */
  aplicarSemLimite(perfil: PerfilPlano, semLimite: boolean): void {
    const controle = this.form.get(perfil.limite)!;
    if (semLimite) {
      controle.setValue(null);
      controle.disable();
    } else {
      controle.enable();
      if (controle.value == null) { controle.setValue(1); }
    }
  }

  /**
   * Mostra erro só depois que o campo foi tocado.
   * @param nome nome do controle
   * @returns true se deve exibir o erro
   */
  invalido(nome: string): boolean {
    const c: AbstractControl | null = this.form.get(nome);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const recursos = this.recursosDigitados;
    const plano = this.data.plano;
    const request: PlanoAssinaturaRequest = {
      nome: String(v.nome).trim(),
      titulo: String(v.titulo).trim(),
      recursos,
      descricao: this.parser.format(String(v.titulo).trim(), recursos),
      tipo: plano.tipo,
      valorMensal: Number(v.valorMensal),
      limiteAdminOrg: v.semLimiteAdmin ? null : Number(v.limiteAdminOrg),
      limiteProfissional: v.semLimiteProfissional ? null : Number(v.limiteProfissional),
      limiteSecretaria: v.semLimiteSecretaria ? null : Number(v.limiteSecretaria),
      valorAdicionalAdmin: this.numeroOuNulo(v.valorAdicionalAdmin),
      valorAdicionalProfissional: this.numeroOuNulo(v.valorAdicionalProfissional),
      valorAdicionalSecretaria: this.numeroOuNulo(v.valorAdicionalSecretaria)
    };

    this.salvando = true;
    this.planoApiService.atualizarPlano(plano.id, request).subscribe({
      next: () => {
        this.snackBar.open(`Plano ${request.nome} atualizado.`, 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.salvando = false;
        this.snackBar.open(mensagemErroAssinaturaAdmin(err, 'Não foi possível salvar o plano.'), 'Fechar', { duration: 5000 });
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  private numeroOuNulo(valor: unknown): number | null {
    return valor === null || valor === undefined || valor === '' ? null : Number(valor);
  }

  /**
   * Título e recursos do plano. Planos antigos guardam tudo na descrição
   * ("titulo: ...\nRecursos: [...]"), então cai no parser quando os campos separados faltam.
   */
  private lerTextos(plano: PlanoAssinatura): { titulo: string; recursos: string[] } {
    const parsed = this.parser.parse(plano.descricao);
    let titulo = plano.titulo && !plano.titulo.includes('Recursos:') ? plano.titulo : parsed.titulo;
    // Descrição antiga numa linha só ("titulo: X Recursos: [...]"): o parser devolve tudo como título
    const corte = (titulo || '').search(/\s*Recursos:/i);
    if (corte >= 0) { titulo = titulo.slice(0, corte); }
    const recursos = plano.recursos && plano.recursos.length > 0 ? plano.recursos : parsed.recursos;
    return { titulo: (titulo || '').replace(/^titulo:\s*/i, '').trim(), recursos: recursos || [] };
  }
}
