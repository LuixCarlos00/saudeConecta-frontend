import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { EMPTY, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';

import { DashboardComponent } from './dashboard.component';
import { ControleAcessoApiService } from 'src/app/core/data-access/controle-acesso-api.service';
import { DashboardApiService } from 'src/app/core/data-access/dashboard-api.service';
import { AssinaturaApiService } from 'src/app/core/data-access/assinatura-api.service';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { ProfissionalApiService } from 'src/app/core/data-access/profissional-api.service';
import { ConfiguracaoCardService } from 'src/app/core/data-access/configuracao-card.service';
import { ConfiguracaoGraficoDashboardService } from 'src/app/core/data-access/configuracao-grafico-dashboard.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

@Component({ selector: 'app-dashboard-plataforma', template: '' })
class DashboardPlataformaStubComponent {}

describe('DashboardComponent (decisão entre painéis)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let chamadas: string[];

  let statusAssinatura = 'ATIVA';
  let orgAdmin = true;

  function montar(superAdmin: boolean): void {
    // Perfil fixo; qualquer outra checagem de permissão responde false.
    const acesso: any = new Proxy({}, {
      get: (_, metodo: string) => () =>
        metodo === 'isSuperAdmin' ? superAdmin : metodo === 'isAdmin' ? !superAdmin : false
    });

    chamadas = [];
    // Qualquer método chamado devolve EMPTY e fica registrado: prova que o SUPER_ADMIN não toca nas APIs de clínica.
    const stub = (nome: string): any => new Proxy({}, {
      get: (_, metodo: string) => (..._args: unknown[]) => { chamadas.push(`${nome}.${metodo}`); return EMPTY; }
    });

    TestBed.configureTestingModule({
      declarations: [DashboardComponent, DashboardPlataformaStubComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: ControleAcessoApiService, useValue: acesso },
        { provide: DashboardApiService, useValue: stub('DashboardApiService') },
        { provide: AssinaturaApiService, useValue: {
          minhaAssinatura: () => { chamadas.push('AssinaturaApiService.minhaAssinatura'); return of({ status: statusAssinatura }); }
        } },
        { provide: AuthService, useValue: { isOrgAdmin: () => orgAdmin, isRecepcionista: () => false, getOrganizacaoId: () => 1, getCurrentUser: () => null } },
        { provide: ConsultaApiService, useValue: stub('ConsultaApiService') },
        { provide: ProfissionalApiService, useValue: stub('ProfissionalApiService') },
        { provide: ConfiguracaoCardService, useValue: stub('ConfiguracaoCardService') },
        { provide: ConfiguracaoGraficoDashboardService, useValue: stub('ConfiguracaoGraficoDashboardService') },
      ]
    });
    fixture = TestBed.createComponent(DashboardComponent);
  }

  beforeEach(() => { statusAssinatura = 'ATIVA'; orgAdmin = true; });

  it('SUPER_ADMIN: mostra o painel da plataforma, esconde o da clínica e não chama as APIs de clínica', () => {
    montar(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-dashboard-plataforma'))).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.healthcare-content')).toBeNull();
    expect(chamadas).toEqual([]);
  });

  it('ADMIN: mantém o painel da clínica e não mostra o da plataforma', () => {
    montar(false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-dashboard-plataforma'))).toBeNull();
    expect(fixture.nativeElement.querySelector('.healthcare-content')).toBeTruthy();
    expect(chamadas.length).toBeGreaterThan(0);
  });

  it('assinatura SUSPENSA: não dispara as chamadas do painel (evita enxurrada de 403) e leva o ADMIN a /minha-assinatura', () => {
    statusAssinatura = 'SUSPENSA';
    montar(false);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    expect(chamadas).toEqual(['AssinaturaApiService.minhaAssinatura']);
    expect(navigate).toHaveBeenCalledWith(['/minha-assinatura']);
  });

  it('assinatura SUSPENSA para perfil sem acesso à tela de pagamento: não carrega nem redireciona', () => {
    statusAssinatura = 'SUSPENSA';
    orgAdmin = false;
    montar(false);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    expect(chamadas).toEqual(['AssinaturaApiService.minhaAssinatura']);
    expect(navigate).not.toHaveBeenCalled();
  });
});
