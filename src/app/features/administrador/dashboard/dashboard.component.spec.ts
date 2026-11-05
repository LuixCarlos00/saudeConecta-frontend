import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { EMPTY } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { DashboardApiService } from 'src/app/services/api/dashboard-api.service';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { ConfiguracaoCardService } from 'src/app/services/api/configuracao-card.service';
import { ConfiguracaoGraficoDashboardService } from 'src/app/core/services/configuracao-grafico-dashboard.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';

@Component({ selector: 'app-dashboard-plataforma', template: '' })
class DashboardPlataformaStubComponent {}

describe('DashboardComponent (decisão entre painéis)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let chamadas: string[];

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
        { provide: AssinaturaApiService, useValue: stub('AssinaturaApiService') },
        { provide: ConsultaApiService, useValue: stub('ConsultaApiService') },
        { provide: ProfissionalApiService, useValue: stub('ProfissionalApiService') },
        { provide: ConfiguracaoCardService, useValue: stub('ConfiguracaoCardService') },
        { provide: ConfiguracaoGraficoDashboardService, useValue: stub('ConfiguracaoGraficoDashboardService') },
      ]
    });
    fixture = TestBed.createComponent(DashboardComponent);
  }

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
});
