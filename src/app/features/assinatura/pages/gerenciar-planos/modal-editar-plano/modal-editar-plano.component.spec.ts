import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { PlanoAssinatura } from 'src/app/shared/models/PlanoAssinatura';
import { ModalEditarPlanoComponent } from './modal-editar-plano.component';

describe('ModalEditarPlanoComponent', () => {
  let api: jasmine.SpyObj<PlanoApiService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ModalEditarPlanoComponent, boolean>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const planoBase = (): PlanoAssinatura => ({
    id: 2, nome: 'Profissional', tipo: 'PROFISSIONAL', valorMensal: 279, ativo: true,
    descricao: 'titulo: Para clínicas\nRecursos: ["A","B"]',
    titulo: 'Para clínicas', recursos: ['A', 'B'],
    limiteAdminOrg: 2, limiteProfissional: 8, limiteSecretaria: null,
    valorAdicionalAdmin: 59, valorAdicionalProfissional: 39, valorAdicionalSecretaria: 29
  });

  function criar(plano: PlanoAssinatura = planoBase()): ModalEditarPlanoComponent {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        ModalEditarPlanoComponent,
        { provide: PlanoApiService, useValue: api },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { plano } }
      ]
    });
    return TestBed.inject(ModalEditarPlanoComponent);
  }

  beforeEach(() => {
    api = jasmine.createSpyObj('PlanoApiService', ['atualizarPlano']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
  });

  it('preenche o formulário com o plano e marca "sem limite" quando o limite é null', () => {
    const c = criar();
    expect(c.form.get('nome')!.value).toBe('Profissional');
    expect(c.form.get('recursos')!.value).toBe('A\nB');
    expect(c.form.get('semLimiteSecretaria')!.value).toBeTrue();
    expect(c.form.get('limiteSecretaria')!.disabled).toBeTrue();
  });

  it('descrição antiga numa linha só: separa a frase dos recursos', () => {
    const c = criar({ ...planoBase(), titulo: undefined, recursos: [], descricao: 'titulo: Para clínicas Recursos: ["X"]' });
    expect(c.form.get('titulo')!.value).toBe('Para clínicas');
  });

  it('salva com limites e recursos convertidos e fecha com true', () => {
    api.atualizarPlano.and.returnValue(of(planoBase()));
    const c = criar();
    c.form.patchValue({ recursos: 'A\n\n  B  \nC' });
    c.salvar();
    const request = api.atualizarPlano.calls.mostRecent().args[1];
    expect(api.atualizarPlano.calls.mostRecent().args[0]).toBe(2);
    expect(request.recursos).toEqual(['A', 'B', 'C']);
    expect(request.limiteSecretaria).toBeNull();
    expect(request.limiteProfissional).toBe(8);
    expect(request.tipo).toBe('PROFISSIONAL');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('desmarcar "sem limite" volta a pedir um número, começando em 1', () => {
    const c = criar();
    c.aplicarSemLimite(c.perfis[2], false);
    expect(c.form.get('limiteSecretaria')!.enabled).toBeTrue();
    expect(c.form.get('limiteSecretaria')!.value).toBe(1);
  });

  it('formulário inválido não chama o back', () => {
    const c = criar();
    c.form.patchValue({ nome: '' });
    c.salvar();
    expect(api.atualizarPlano).not.toHaveBeenCalled();
  });

  it('valor negativo é inválido', () => {
    const c = criar();
    c.form.patchValue({ valorMensal: -1 });
    expect(c.form.invalid).toBeTrue();
  });

  it('erro do back mostra mensagem, não fecha e libera o botão', () => {
    api.atualizarPlano.and.returnValue(throwError(() => ({ status: 500, error: { message: 'Falhou' } })));
    const c = criar();
    c.salvar();
    expect(snackBar.open).toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(c.salvando).toBeFalse();
  });
});
