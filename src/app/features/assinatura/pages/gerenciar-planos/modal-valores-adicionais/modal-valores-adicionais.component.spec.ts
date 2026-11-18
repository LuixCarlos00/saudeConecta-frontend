import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { PlanoAssinatura } from 'src/app/shared/models/PlanoAssinatura';
import { ModalValoresAdicionaisComponent } from './modal-valores-adicionais.component';

describe('ModalValoresAdicionaisComponent', () => {
  let api: jasmine.SpyObj<PlanoApiService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ModalValoresAdicionaisComponent, boolean>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let c: ModalValoresAdicionaisComponent;

  const plano = (id: number, nome: string): PlanoAssinatura => ({
    id, nome, tipo: nome.toUpperCase(), valorMensal: 100 * id, ativo: true, descricao: '',
    limiteAdminOrg: 1, limiteProfissional: 2, limiteSecretaria: 1,
    valorAdicionalAdmin: 59, valorAdicionalProfissional: 39, valorAdicionalSecretaria: 29
  });

  beforeEach(() => {
    api = jasmine.createSpyObj('PlanoApiService', ['atualizarPlano']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [
        ModalValoresAdicionaisComponent,
        { provide: PlanoApiService, useValue: api },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { planos: [plano(1, 'Starter'), plano(2, 'Profissional'), plano(3, 'Business')] } }
      ]
    });
    c = TestBed.inject(ModalValoresAdicionaisComponent);
  });

  it('começa sem alterações e não salva nada', () => {
    expect(c.planosAlterados.length).toBe(0);
    c.salvar();
    expect(api.atualizarPlano).not.toHaveBeenCalled();
  });

  it('envia ao back só o plano que mudou, com o resto do plano intacto', () => {
    api.atualizarPlano.and.returnValue(of({} as any));
    c.definir(c.planos[1], 'valorAdicionalProfissional', '45');
    c.salvar();
    expect(api.atualizarPlano).toHaveBeenCalledTimes(1);
    const [id, req] = api.atualizarPlano.calls.mostRecent().args;
    expect(id).toBe(2);
    expect(req.valorAdicionalProfissional).toBe(45);
    expect(req.valorAdicionalAdmin).toBe(59);
    expect(req.valorMensal).toBe(200);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('voltar ao valor original deixa de contar como alteração', () => {
    c.definir(c.planos[0], 'valorAdicionalAdmin', 70);
    expect(c.planosAlterados.length).toBe(1);
    c.definir(c.planos[0], 'valorAdicionalAdmin', 59);
    expect(c.planosAlterados.length).toBe(0);
  });

  it('campo vazio vira null', () => {
    c.definir(c.planos[0], 'valorAdicionalSecretaria', '');
    expect(c.valor(c.planos[0], 'valorAdicionalSecretaria')).toBeNull();
  });

  it('valor negativo bloqueia o salvar', () => {
    c.definir(c.planos[2], 'valorAdicionalAdmin', -5);
    expect(c.temErro).toBeTrue();
    c.salvar();
    expect(api.atualizarPlano).not.toHaveBeenCalled();
  });

  it('erro do back avisa e fecha com true para a tela recarregar o que ficou salvo', () => {
    api.atualizarPlano.and.returnValue(throwError(() => ({ status: 500 })));
    c.definir(c.planos[0], 'valorAdicionalAdmin', 70);
    c.salvar();
    expect(snackBar.open).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('não altera o objeto do plano recebido antes de salvar', () => {
    c.definir(c.planos[0], 'valorAdicionalAdmin', 70);
    expect(c.planos[0].valorAdicionalAdmin).toBe(59);
  });
});
