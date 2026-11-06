import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/core/auth/auth.service';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';
import { AgendaCalendarioComponent } from './agenda-calendario.component';

describe('AgendaCalendarioComponent: Retomar atendimento', () => {
  let component: AgendaCalendarioComponent;
  let fixture: ComponentFixture<AgendaCalendarioComponent>;
  let http: HttpTestingController;
  const urlRascunhos = `${environment.apiUrl}/atendimentos/rascunhos/meus`;

  function montar(perfil: string): void {
    TestBed.configureTestingModule({
      declarations: [AgendaCalendarioComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO,
        {
          provide: AuthService,
          useValue: {
            currentUser$: of({ id: 1, perfil }),
            getCurrentUser: () => ({ id: 1, perfil }),
            getUserRole: () => 'ROLE_DOCTOR',
            isSuperAdmin: () => false,
            isOrgAdmin: () => false,
            isProfissional: () => false,
            isRecepcionista: () => false,
            getOrganizacaoId: () => 1,
          },
        },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AgendaCalendarioComponent);
    component = fixture.componentInstance;
  }

  it('profissional clinico: busca os rascunhos uma vez e marca as consultas com rascunho', () => {
    montar('CLINICO');
    fixture.detectChanges();
    http.expectOne(urlRascunhos).flush([
      { consultaId: 822, atualizadoEm: '2026-11-05T14:32:10', tempoAcumuladoSegundos: 754 },
    ]);
    http.match(() => true);
    expect(component.temRascunho({ id: 822 } as any)).toBeTrue();
    expect(component.temRascunho({ id: 823 } as any)).toBeFalse();
    expect(component.temRascunho(null)).toBeFalse();
    http.expectNone(urlRascunhos);
  });

  it('outros perfis nao fazem a chamada', () => {
    montar('SECRETARIA');
    fixture.detectChanges();
    http.expectNone(urlRascunhos);
    http.match(() => true);
    expect(component.consultasComRascunho.size).toBe(0);
  });

  it('falha na lista nao quebra a agenda: ninguem aparece como "Retomar"', () => {
    montar('CLINICO');
    fixture.detectChanges();
    http.expectOne(urlRascunhos).flush('erro', { status: 500, statusText: 'Server Error' });
    http.match(() => true);
    expect(component.temRascunho({ id: 822 } as any)).toBeFalse();
  });
});
