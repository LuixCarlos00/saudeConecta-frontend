import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { TrocaSenhaComponent } from './troca-senha.component';
import { UsuarioApiService } from 'src/app/core/data-access/usuario-api.service';
import { AuthService } from 'src/app/core/auth/auth.service';

describe('TrocaSenhaComponent', () => {
  const USUARIO_LOGADO_ID = 7;

  let component: TrocaSenhaComponent;
  let fixture: ComponentFixture<TrocaSenhaComponent>;
  let usuarioApiService: jasmine.SpyObj<UsuarioApiService>;
  let swalFire: jasmine.Spy;
  let logout: jasmine.Spy;
  /** Liga o cenário de primeiro acesso; lido no ngOnInit, então mude e chame criar() de novo. */
  let primeiroAcesso = false;

  /** Recria o componente (o ngOnInit lê de novo se é primeiro acesso). */
  function criar(): void {
    fixture = TestBed.createComponent(TrocaSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.TrocarSenha();
  }

  beforeEach(async () => {
    primeiroAcesso = false;
    logout = jasmine.createSpy('logout');
    usuarioApiService = jasmine.createSpyObj<UsuarioApiService>('UsuarioApiService', ['trocarSenharUsuariobyOrg']);
    const authServiceMock = {
      currentUser$: of({ id: USUARIO_LOGADO_ID }),
      deveTrocarSenha: () => primeiroAcesso,
      logout,
    };

    await TestBed.configureTestingModule({
      declarations: [TrocaSenhaComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: UsuarioApiService, useValue: usuarioApiService },
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    swalFire = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));

    criar();
  });

  describe('primeiro acesso', () => {
    beforeEach(() => {
      primeiroAcesso = true;
      criar();
    });

    it('mostra o aviso de senha provisória no lugar do texto padrão', () => {
      const cabecalho: HTMLElement = fixture.nativeElement.querySelector('.cabecalho');
      expect(cabecalho.querySelector('h1')?.textContent).toContain('Crie a sua senha');
      expect(cabecalho.querySelector('.cabecalho__aviso')?.textContent).toContain('provisória');
    });

    it('depois de trocar, desloga e pede para entrar com a nova senha', () => {
      usuarioApiService.trocarSenharUsuariobyOrg.and.returnValue(of(void 0));
      preencher('NovaSenha@1', 'NovaSenha@1');

      component.enviar();

      expect(usuarioApiService.trocarSenharUsuariobyOrg).toHaveBeenCalledOnceWith(USUARIO_LOGADO_ID, 'NovaSenha@1');
      expect(logout).toHaveBeenCalledTimes(1);
      expect(textosDosAlertas()).toEqual(['Entre novamente com a sua nova senha.']);
    });

    it('se a troca falhar, continua logado na tela de troca', () => {
      usuarioApiService.trocarSenharUsuariobyOrg.and.returnValue(throwError(() => ({ status: 400 })));
      preencher('NovaSenha@1', 'NovaSenha@1');

      component.enviar();

      expect(logout).not.toHaveBeenCalled();
    });
  });

  it('fora do primeiro acesso: mantém o título padrão e não desloga ao trocar', () => {
    usuarioApiService.trocarSenharUsuariobyOrg.and.returnValue(of(void 0));
    preencher('NovaSenha@1', 'NovaSenha@1');

    component.enviar();

    expect(fixture.nativeElement.querySelector('.cabecalho h1').textContent).toContain('Segurança da conta');
    expect(fixture.nativeElement.querySelector('.cabecalho__aviso')).toBeNull();
    expect(logout).not.toHaveBeenCalled();
  });

  /** Preenche os dois campos da aba "Trocar Senha" (nova senha e repetição). */
  function preencher(novaSenha: string, repeticao: string): void {
    component.FormularioTrocaSenha.setValue({ SenhaAntiga: novaSenha, SenhaNova: repeticao });
  }

  function textosDosAlertas(): string[] {
    return swalFire.calls.allArgs().map(([opcoes]) => (opcoes as { text: string }).text);
  }

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('com senhas iguais e sucesso na API, mostra só o alerta de sucesso', () => {
    usuarioApiService.trocarSenharUsuariobyOrg.and.returnValue(of(void 0));
    preencher('NovaSenha@1', 'NovaSenha@1');

    component.enviar();

    expect(usuarioApiService.trocarSenharUsuariobyOrg).toHaveBeenCalledOnceWith(USUARIO_LOGADO_ID, 'NovaSenha@1');
    expect(textosDosAlertas()).toEqual(['Senha alterada com sucesso']);
  });

  it('com senhas diferentes, não chama a API e mostra "Senhas diferentes"', () => {
    preencher('NovaSenha@1', 'OutraSenha@2');

    component.enviar();

    expect(usuarioApiService.trocarSenharUsuariobyOrg).not.toHaveBeenCalled();
    expect(textosDosAlertas()).toEqual(['Senhas diferentes']);
  });

  it('com senhas iguais e erro na API, mostra só o alerta de erro', () => {
    usuarioApiService.trocarSenharUsuariobyOrg.and.returnValue(throwError(() => ({ status: 403 })));
    preencher('NovaSenha@1', 'NovaSenha@1');

    component.enviar();

    expect(textosDosAlertas()).toEqual(['Senha inválida']);
  });
});
