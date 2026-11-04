import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { ControleAcessoApiService } from './controle-acesso-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

describe('ControleAcessoApiService.podeGerenciarAdministrador', () => {
  function criarServico(aud: string): ControleAcessoApiService {
    TestBed.configureTestingModule({
      providers: [{
        provide: tokenService,
        useValue: {
          decodificaToken: () => {},
          UsuarioLogadoValue$: new BehaviorSubject<any>(null),
          obterAutorizacao: () => aud,
        }
      }]
    });
    return TestBed.inject(ControleAcessoApiService);
  }

  it('permite para ROLE_ADMIN (GESTOR)', () => {
    expect(criarServico('ROLE_ADMIN').podeGerenciarAdministrador()).toBeTrue();
  });

  it('permite para ROLE_SUPER_ADMIN (ROOT)', () => {
    expect(criarServico('ROLE_SUPER_ADMIN').podeGerenciarAdministrador()).toBeTrue();
  });

  it('nega para ROLE_PROFISSIONAL (CLINICO)', () => {
    expect(criarServico('ROLE_PROFISSIONAL').podeGerenciarAdministrador()).toBeFalse();
  });

  it('nega para ROLE_RECEPCIONISTA (ASSISTENTE)', () => {
    expect(criarServico('ROLE_RECEPCIONISTA').podeGerenciarAdministrador()).toBeFalse();
  });
});
