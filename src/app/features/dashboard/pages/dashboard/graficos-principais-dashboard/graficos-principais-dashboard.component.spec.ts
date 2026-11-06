import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { GraficosPrincipaisDashboardComponent } from './graficos-principais-dashboard.component';

/** Cada perfil vê só os gráficos que o componente pai liga pelos @Input. */
describe('GraficosPrincipaisDashboardComponent', () => {
  let fixture: ComponentFixture<GraficosPrincipaisDashboardComponent>;

  const seletores = {
    consultas: 'app-grafico-consultas',
    agendamentos: 'app-grafico-agendamentos',
    saldo: 'app-grafico-saldo',
    categoria: 'app-grafico-categoria',
    mediaTempo: 'app-grafico-media-tempo',
  };

  function visiveis(): string[] {
    return Object.entries(seletores)
      .filter(([, seletor]) => fixture.nativeElement.querySelector(seletor))
      .map(([nome]) => nome);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraficosPrincipaisDashboardComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();
    fixture = TestBed.createComponent(GraficosPrincipaisDashboardComponent);
  });

  it('padrão: consultas e agendamentos', () => {
    fixture.detectChanges();
    expect(visiveis()).toEqual(['consultas', 'agendamentos']);
  });

  it('gráficos secundários da administração: saldo e categoria', () => {
    const c = fixture.componentInstance;
    c.exibirConsultasPorPeriodo = false;
    c.exibirAgendamentos = false;
    c.exibirSaldoFinanceiro = true;
    c.exibirMedicosPorEspecialidade = true;
    fixture.detectChanges();
    expect(visiveis()).toEqual(['saldo', 'categoria']);
  });

  it('profissional: agendamentos e tempo médio', () => {
    const c = fixture.componentInstance;
    c.exibirConsultasPorPeriodo = false;
    c.exibirAgendamentos = true;
    c.exibirMediaTempoConsulta = true;
    fixture.detectChanges();
    expect(visiveis()).toEqual(['agendamentos', 'mediaTempo']);
  });

  it('tudo desligado: grid vazio', () => {
    const c = fixture.componentInstance;
    c.exibirConsultasPorPeriodo = false;
    c.exibirAgendamentos = false;
    fixture.detectChanges();
    expect(visiveis()).toEqual([]);
  });

  it('um gráfico ligado depois do carregamento inicial passa a aparecer', () => {
    const c = fixture.componentInstance;
    c.exibirConsultasPorPeriodo = false;
    c.exibirAgendamentos = false;
    fixture.detectChanges();
    c.exibirSaldoFinanceiro = true;
    fixture.detectChanges();
    expect(visiveis()).toEqual(['saldo']);
  });
});
