import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { AssinaturaApiService } from 'src/app/core/data-access/assinatura-api.service';
import { CobrancaApiService } from 'src/app/features/assinatura/data-access/cobranca-api.service';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { MENSAGEM_MP_VALOR_NAO_ATUALIZADO } from 'src/app/shared/utils/mensagem-erro-http';
import { ModalAssociarPlanoComponent } from './modal-associar-plano.component';

describe('ModalAssociarPlanoComponent (super admin)', () => {
  let api: jasmine.SpyObj<AssinaturaApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ModalAssociarPlanoComponent>>;
  let c: ModalAssociarPlanoComponent;
  const erro502 = () => throwError(() => ({ status: 502, error: { code: 'MP_VALOR_NAO_ATUALIZADO', message: 'interno' } }));

  beforeEach(() => {
    api = jasmine.createSpyObj('AssinaturaApiService', ['assinar', 'customizarPlano', 'listarPorOrganizacao']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    notificacao = jasmine.createSpyObj('NotificacaoService', ['fire']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      providers: [
        ModalAssociarPlanoComponent,
        { provide: AssinaturaApiService, useValue: api },
        { provide: PlanoApiService, useValue: {} },
        { provide: CobrancaApiService, useValue: {} },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: NotificacaoService, useValue: notificacao },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { organizacaoId: 7, nomeOrganizacao: 'Clínica' } },
      ],
    });
    c = TestBed.inject(ModalAssociarPlanoComponent);
  });

  it('troca de plano: mostra o aviso, não fecha o modal e libera o botão', () => {
    api.assinar.and.returnValue(erro502());
    c.planoSelecionado = 2;
    c.modoEdicao = true;
    c.assinaturaAtual = { planoId: 1 } as any;
    c.associarPlano();
    expect(snackBar.open).toHaveBeenCalledWith(MENSAGEM_MP_VALOR_NAO_ATUALIZADO, 'Fechar', { duration: 5000 });
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(c.isSaving).toBeFalse();
  });

  it('customização: mostra o aviso e não recarrega os dados da tela', () => {
    spyOn(console, 'error');
    api.customizarPlano.and.returnValue(erro502());
    c.salvarCustomizacao();
    expect(notificacao.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'error', text: MENSAGEM_MP_VALOR_NAO_ATUALIZADO
    }));
    expect(api.listarPorOrganizacao).not.toHaveBeenCalled();
    expect(c.isSavingCustom).toBeFalse();
  });

  it('troca de plano com sucesso fecha o modal', () => {
    api.assinar.and.returnValue(of({} as any));
    c.planoSelecionado = 2;
    c.associarPlano();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('clínica sem assinatura: cria pela rota do contrato (POST /assinaturas) e diz "associado"', () => {
    api.assinar.and.returnValue(of({} as any));
    c.planoSelecionado = 2;
    c.modoEdicao = false;
    c.associarPlano();
    expect(api.assinar).toHaveBeenCalledOnceWith({ organizacaoId: 7, planoId: 2 });
    expect(snackBar.open).toHaveBeenCalledWith('Plano associado com sucesso!', 'Fechar', { duration: 3000 });
  });

  it('clínica com assinatura: troca pela mesma rota e diz "alterado" (decide pelo modoEdicao, não pelo status)', () => {
    api.assinar.and.returnValue(of({ status: 'ATIVA' } as any));
    c.planoSelecionado = 2;
    c.modoEdicao = true;
    c.assinaturaAtual = { planoId: 1 } as any;
    c.associarPlano();
    expect(api.assinar).toHaveBeenCalledOnceWith({ organizacaoId: 7, planoId: 2 });
    expect(snackBar.open).toHaveBeenCalledWith('Plano alterado com sucesso!', 'Fechar', { duration: 3000 });
  });

  it('troca para o mesmo plano não chama o back', () => {
    c.planoSelecionado = 1;
    c.modoEdicao = true;
    c.assinaturaAtual = { planoId: 1 } as any;
    c.associarPlano();
    expect(api.assinar).not.toHaveBeenCalled();
  });

  it('409 ASSINATURA_SUSPENSA e 409 PREAPPROVAL_SUBSTITUIDO_EM_ANALISE mostram o texto do contrato', () => {
    c.planoSelecionado = 2;
    api.assinar.and.returnValue(throwError(() => ({ status: 409, error: { code: 'ASSINATURA_SUSPENSA', message: 'x' } })));
    c.associarPlano();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Clínica suspensa: dê cortesia ou cancele a assinatura antes de associar um plano.', 'Fechar', { duration: 5000 });
    api.assinar.and.returnValue(throwError(() => ({ status: 409, error: { code: 'PREAPPROVAL_SUBSTITUIDO_EM_ANALISE', message: 'x' } })));
    c.associarPlano();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Há um pagamento anterior em análise. Resolva a pendência no Mercado Pago antes.', 'Fechar', { duration: 5000 });
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
