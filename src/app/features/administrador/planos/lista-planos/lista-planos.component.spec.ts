import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { MENSAGEM_MP_VALOR_NAO_ATUALIZADO, MENSAGEM_PREAPPROVAL_EM_ANALISE_CLIENTE } from 'src/app/shared/utils/mensagem-erro-http';
import { ListaPlanosComponent } from './lista-planos.component';

describe('ListaPlanosComponent - troca de plano', () => {
  let api: jasmine.SpyObj<AssinaturaApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let c: ListaPlanosComponent;
  const atual: any = { id: 1, status: 'ATIVA', planoId: 1 };
  const novo: any = { id: 2, nome: 'Premium' };

  beforeEach(() => {
    api = jasmine.createSpyObj('AssinaturaApiService', ['trocarPlano']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [
        ListaPlanosComponent,
        { provide: AssinaturaApiService, useValue: api },
        { provide: PlanoApiService, useValue: {} },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    c = TestBed.inject(ListaPlanosComponent);
    c.assinaturaAtiva = atual;
    c.planoSelecionado = novo;
  });

  it('sucesso atualiza a assinatura e mostra confirmação', () => {
    api.trocarPlano.and.returnValue(of({ id: 1, planoId: 2 } as any));
    c.assinarPlano(novo);
    expect(c.assinaturaAtiva?.planoId).toBe(2);
    expect(snackBar.open).toHaveBeenCalledWith('Plano alterado para Premium!', 'Fechar', { duration: 3000 });
  });

  it('502 MP_VALOR_NAO_ATUALIZADO mostra o aviso e não altera o estado da tela', () => {
    api.trocarPlano.and.returnValue(throwError(() => ({
      status: 502, error: { code: 'MP_VALOR_NAO_ATUALIZADO', message: 'interno' }
    })));
    c.assinarPlano(novo);
    expect(snackBar.open).toHaveBeenCalledOnceWith(MENSAGEM_MP_VALOR_NAO_ATUALIZADO, 'Fechar', { duration: 5000 });
    expect(c.assinaturaAtiva).toBe(atual);
    expect(c.planoSelecionado).toBe(novo);
  });

  it('409 PREAPPROVAL_SUBSTITUIDO_EM_ANALISE mostra o texto do cliente e mantém a tela', () => {
    api.trocarPlano.and.returnValue(throwError(() => ({
      status: 409, error: { code: 'PREAPPROVAL_SUBSTITUIDO_EM_ANALISE', message: 'interno' }
    })));
    c.assinarPlano(novo);
    expect(snackBar.open).toHaveBeenCalledOnceWith(MENSAGEM_PREAPPROVAL_EM_ANALISE_CLIENTE, 'Fechar', { duration: 5000 });
    expect(c.assinaturaAtiva).toBe(atual);
  });
});
