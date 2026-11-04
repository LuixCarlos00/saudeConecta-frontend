import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { TrocaSenhaComponent } from './troca-senha.component';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { UsuarioApiService } from 'src/app/services/api/usuario-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

describe('TrocaSenhaComponent', () => {
  const USUARIO_LOGADO_ID = 7;

  let component: TrocaSenhaComponent;
  let fixture: ComponentFixture<TrocaSenhaComponent>;
  let usuarioApiService: jasmine.SpyObj<UsuarioApiService>;
  let swalFire: jasmine.Spy;

  beforeEach(async () => {
    usuarioApiService = jasmine.createSpyObj<UsuarioApiService>('UsuarioApiService', ['trocarSenharUsuariobyOrg']);
    const tokenServiceMock = {
      decodificaToken: () => {},
      UsuarioLogadoValue$: of({ id: USUARIO_LOGADO_ID }),
    };

    await TestBed.configureTestingModule({
      declarations: [TrocaSenhaComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AdministradorApiService, useValue: {} },
        { provide: UsuarioApiService, useValue: usuarioApiService },
        { provide: tokenService, useValue: tokenServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    swalFire = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));

    fixture = TestBed.createComponent(TrocaSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.TrocarSenha();
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
