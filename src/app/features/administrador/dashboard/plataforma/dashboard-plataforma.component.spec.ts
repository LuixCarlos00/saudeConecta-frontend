import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgChartsModule } from 'ng2-charts';
import { Subject, of, throwError } from 'rxjs';

import { DashboardPlataformaComponent } from './dashboard-plataforma.component';
import { DashboardPlataforma, PlataformaDashboardApiService } from 'src/app/services/api/plataforma-dashboard-api.service';
import { IMPORTS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

function criarDashboard(sobrepor: Partial<DashboardPlataforma['resumo']> = {}): DashboardPlataforma {
  return {
    geradoEm: '2026-11-05T15:20:00',
    resumo: {
      clinicasTotal: 42, clinicasAtivas: 37, emTrial: 6, trialsVencendo7Dias: 2, inadimplentes: 3, suspensas: 1,
      canceladas: 4, cortesias: 2, mrr: 12450, receitaMesAtual: 9870, receitaMesAnterior: 11020, ticketMedio: 336.49,
      pendenciasManuais: 1, usuariosAtivos: 310, consultasMesAtual: 5120, ...sobrepor
    },
    porStatus: [
      { status: 'ATIVA', quantidade: 28 }, { status: 'TRIAL', quantidade: 6 }, { status: 'INADIMPLENTE', quantidade: 3 },
      { status: 'SUSPENSA', quantidade: 1 }, { status: 'CANCELADA', quantidade: 4 }
    ],
    porPlano: [{ plano: 'BUSINESS', quantidade: 9, mrr: 6300 }, { plano: 'STARTER', quantidade: 20, mrr: 2980 }],
    serieMensal: [
      { mes: '2026-10', novasClinicas: 3, cancelamentos: 1, receitaRecebida: 8800, consultas: 4300 },
      { mes: '2026-11', novasClinicas: 2, cancelamentos: 0, receitaRecebida: 9870, consultas: 5120 }
    ],
    usuariosPorPerfil: [{ perfil: 'CLINICO', quantidade: 180 }],
    topClinicasUso: [
      { organizacaoId: 7, nome: 'Clínica Vida Plena', plano: 'BUSINESS', status: 'ATIVA', consultasMes: 640, profissionais: 8 }
    ],
    atencao: [
      { organizacaoId: 12, nome: 'Clínica X', plano: 'STARTER', status: 'INADIMPLENTE', motivo: 'INADIMPLENTE', dataVencimento: '2026-10-28', valorMensal: 149 },
      { organizacaoId: null, nome: 'Evento Mercado Pago #55', plano: null, status: null, motivo: 'PENDENCIA_MANUAL', dataVencimento: '2026-11-04', valorMensal: null }
    ]
  };
}

describe('DashboardPlataformaComponent', () => {
  let fixture: ComponentFixture<DashboardPlataformaComponent>;
  let component: DashboardPlataformaComponent;
  let buscar: jasmine.Spy;

  const texto = (seletor: string): string =>
    (fixture.nativeElement.querySelector(seletor)?.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  function montar(resposta: any): void {
    buscar = jasmine.createSpy('buscar').and.returnValue(resposta);
    TestBed.configureTestingModule({
      declarations: [DashboardPlataformaComponent],
      imports: [...IMPORTS_TESTE_PADRAO, NgChartsModule],
      providers: [{ provide: PlataformaDashboardApiService, useValue: { buscar } }]
    });
    fixture = TestBed.createComponent(DashboardPlataformaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('busca com meses=12 por padrão e renderiza os KPIs formatados em pt-BR', () => {
    montar(of(criarDashboard()));
    expect(buscar).toHaveBeenCalledOnceWith(12);
    expect(texto('[data-testid=kpi-ativas]')).toBe('37');
    expect(fixture.nativeElement.textContent).toContain('de 42 com assinatura');
    expect(texto('[data-testid=kpi-mrr]')).toBe('R$ 12.450,00');
    expect(texto('[data-testid=kpi-receita]')).toBe('R$ 9.870,00');
    expect(texto('[data-testid=kpi-inadimplencia]')).toBe('4');
    expect(texto('[data-testid=kpi-trials]')).toBe('2');
    expect(texto('[data-testid=kpi-pendencias]')).toBe('1');
  });

  it('mostra variação negativa em vermelho (seta para baixo) sobre o mês anterior', () => {
    montar(of(criarDashboard()));
    const el = fixture.nativeElement.querySelector('[data-testid=kpi-variacao]');
    expect(el.classList).toContain('variacao--queda');
    expect(el.querySelector('.fa-arrow-down')).toBeTruthy();
    expect(texto('[data-testid=kpi-variacao]')).toContain('10,4%');
  });

  it('mostra variação positiva em verde (seta para cima)', () => {
    montar(of(criarDashboard({ receitaMesAtual: 12000, receitaMesAnterior: 10000 })));
    const el = fixture.nativeElement.querySelector('[data-testid=kpi-variacao]');
    expect(el.classList).toContain('variacao--alta');
    expect(el.querySelector('.fa-arrow-up')).toBeTruthy();
    expect(texto('[data-testid=kpi-variacao]')).toContain('20%');
  });

  it('sem receita no mês anterior não inventa percentual', () => {
    montar(of(criarDashboard({ receitaMesAnterior: 0 })));
    expect(component.variacaoReceita).toBeNull();
    expect(texto('[data-testid=kpi-variacao]')).toContain('Sem base');
  });

  it('cards de alerta só ganham destaque quando o valor é maior que 0', () => {
    montar(of(criarDashboard({ inadimplentes: 0, suspensas: 0, trialsVencendo7Dias: 0, pendenciasManuais: 0 })));
    for (const id of ['inadimplencia', 'trials', 'pendencias']) {
      const card = fixture.nativeElement.querySelector(`[data-testid=kpi-card-${id}]`);
      expect(card.classList).not.toContain('kpi--alerta');
      expect(card.classList).not.toContain('kpi--critico');
    }
  });

  it('cards de alerta ganham destaque quando o valor é maior que 0', () => {
    montar(of(criarDashboard()));
    expect(fixture.nativeElement.querySelector('[data-testid=kpi-card-inadimplencia]').classList).toContain('kpi--critico');
    expect(fixture.nativeElement.querySelector('[data-testid=kpi-card-trials]').classList).toContain('kpi--alerta');
    expect(fixture.nativeElement.querySelector('[data-testid=kpi-card-pendencias]').classList).toContain('kpi--alerta');
  });

  it('exibe "Atualizado às HH:mm" a partir de geradoEm', () => {
    montar(of(criarDashboard()));
    expect(texto('[data-testid=atualizado-as]')).toBe('Atualizado às 15:20');
  });

  it('lista "Precisa de atenção" com badge, vencimento dd/MM/yyyy, valor e link para a clínica', () => {
    montar(of(criarDashboard()));
    const itens = fixture.nativeElement.querySelectorAll('[data-testid=atencao] li');
    expect(itens.length).toBe(2);
    expect(itens[0].querySelector('[data-testid=atencao-motivo]').textContent.trim()).toBe('Inadimplente');
    expect(itens[0].querySelector('.badge--inadimplente')).toBeTruthy();
    expect(itens[0].querySelector('[data-testid=atencao-vencimento]').textContent).toContain('28/10/2026');
    expect(itens[0].querySelector('[data-testid=atencao-valor]').textContent.replace(/ /g, ' ')).toContain('R$ 149,00');
    expect(itens[0].querySelector('a').getAttribute('href')).toContain('/Gerenciamento-Usuarios?organizacaoId=12');
    // pendência manual: campos null não quebram, leva à tela de pendências e não mostra valor
    expect(itens[1].querySelector('.badge--pendencia-manual')).toBeTruthy();
    expect(itens[1].querySelector('a').getAttribute('href')).toBe('/pendencias-manuais');
    expect(itens[1].querySelector('[data-testid=atencao-valor]')).toBeNull();
    expect(itens[1].textContent).toContain('Evento Mercado Pago #55');
    expect(itens[1].querySelector('[data-testid=atencao-vencimento]').textContent).toContain('04/11/2026');
  });

  it('o KPI de pendências manuais leva à tela de pendências', () => {
    montar(of(criarDashboard()));
    expect(fixture.nativeElement.querySelector('[data-testid=kpi-pendencias-link]').getAttribute('href')).toBe('/pendencias-manuais');
  });

  it('renderiza a tabela Top clínicas por uso', () => {
    montar(of(criarDashboard()));
    const linha = texto('[data-testid=top-clinicas] tbody tr');
    expect(linha).toContain('Clínica Vida Plena');
    expect(linha).toContain('BUSINESS');
    expect(linha).toContain('Ativa');
    expect(linha).toContain('640');
  });

  it('seletor de período refaz a chamada com meses', () => {
    montar(of(criarDashboard()));
    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('[data-testid=periodo]'));
    expect(botoes.map(b => b.textContent?.trim())).toEqual(['6 meses', '12 meses', '24 meses']);
    botoes[0].click();
    fixture.detectChanges();
    expect(buscar).toHaveBeenCalledWith(6);
    expect(component.meses).toBe(6);
    botoes[2].click();
    expect(buscar).toHaveBeenCalledWith(24);
    expect(buscar).toHaveBeenCalledTimes(3);
  });

  it('botão de atualizar refaz a chamada com o período atual', () => {
    montar(of(criarDashboard()));
    fixture.nativeElement.querySelector('[data-testid=atualizar]').click();
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(buscar.calls.mostRecent().args).toEqual([12]);
  });

  it('mostra o skeleton enquanto carrega', () => {
    montar(new Subject<DashboardPlataforma>());
    expect(fixture.nativeElement.querySelector('[data-testid=carregando]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid=kpis]')).toBeNull();
  });

  it('erro mostra a mensagem do back e "tentar novamente" refaz a chamada', () => {
    montar(throwError(() => ({ status: 500, error: { message: 'Falha no servidor' } })));
    expect(texto('[data-testid=erro]')).toContain('Falha no servidor');
    expect(fixture.nativeElement.querySelector('[data-testid=kpis]')).toBeNull();
    buscar.and.returnValue(of(criarDashboard()));
    fixture.nativeElement.querySelector('[data-testid=tentar-novamente]').click();
    fixture.detectChanges();
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('[data-testid=erro]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid=kpis]')).toBeTruthy();
  });

  it('erro sem corpo usa mensagem padrão', () => {
    montar(throwError(() => ({ status: 0 })));
    expect(texto('[data-testid=erro]')).toContain('Não foi possível carregar o dashboard da plataforma.');
  });

  it('plataforma sem clínicas mostra o estado vazio', () => {
    montar(of(criarDashboard({ clinicasTotal: 0, clinicasAtivas: 0 })));
    expect(fixture.nativeElement.querySelector('[data-testid=vazio]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid=kpis]')).toBeNull();
  });

  it('monta as configurações de todos os gráficos com cores semânticas e valor em R$ no tooltip', () => {
    montar(of(criarDashboard()));
    const cores = component.graficoStatus!.data.datasets[0].backgroundColor as string[];
    expect(cores).toEqual(['#10b981', '#3b82f6', '#f59e0b', '#ea580c', '#6b7280']);
    expect(component.graficoClinicasPlano).toBeTruthy();
    expect(component.graficoNovasCancelamentos!.data.datasets.length).toBe(2);
    expect(component.graficoUsuarios!.data.labels).toEqual(['CLINICO']);
    expect(component.graficoReceita!.data.labels).toEqual(['out/26', 'nov/26']);
    const label = (component.graficoReceita!.options.plugins!.tooltip!.callbacks!.label as any)({
      dataset: { label: 'Receita recebida' }, parsed: { y: 9870 }
    });
    expect(label.replace(/ /g, ' ')).toBe('Receita recebida: R$ 9.870,00');
  });
});
