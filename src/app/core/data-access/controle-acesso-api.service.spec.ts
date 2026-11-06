import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ControleAcessoApiService } from './controle-acesso-api.service';
import { AuthService } from 'src/app/core/auth/auth.service';

describe('ControleAcessoApiService.podeGerenciarAdministrador', () => {
  function criarServico(aud: string): ControleAcessoApiService {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
    });
    spyOn(TestBed.inject(AuthService), 'getUserRole').and.returnValue(aud);
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
