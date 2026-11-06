import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { gerarDiasMes } from '../agenda-calendario.calculos';
import { AgendaVisaoMesComponent } from './agenda-visao-mes.component';

describe('AgendaVisaoMesComponent', () => {
  let fixture: ComponentFixture<AgendaVisaoMesComponent>;
  let component: AgendaVisaoMesComponent;
  const consulta = (id: number, dataHora: string): any => ({ id, dataHora, status: 'AGENDADA', pacienteNome: `Paciente ${id}` });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgendaVisaoMesComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaVisaoMesComponent);
    component = fixture.componentInstance;
  });

  function render(consultas: any[]): HTMLElement {
    component.diasCalendario = gerarDiasMes(new Date(2026, 10, 1), consultas, new Date(2026, 10, 6));
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('desenha o cabeçalho de dias da semana e as 42 células', () => {
    const el = render([]);
    expect(Array.from(el.querySelectorAll('.dia-semana-header')).map(e => e.textContent!.trim())).toEqual(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    expect(el.querySelectorAll('.celula-dia').length).toBe(42);
    expect(el.querySelectorAll('.celula-dia.hoje').length).toBe(1);
  });

  it('mostra até 3 consultas por dia e "+N mais" para o resto', () => {
    const el = render([1, 2, 3, 4, 5].map(i => consulta(i, `2026-11-06T0${i}:00:00`)));
    const celula = Array.from(el.querySelectorAll('.celula-dia')).find(c => c.querySelector('.numero-dia')!.textContent!.trim() === '6')!;
    expect(celula.querySelectorAll('.evento-chip').length).toBe(3);
    expect(celula.querySelector('.badge-count')!.textContent!.trim()).toBe('5');
    expect(celula.querySelector('.mais-eventos')!.textContent!.trim()).toBe('+2 mais');
  });

  it('clicar no dia emite o dia', () => {
    const el = render([]);
    const emitido: any[] = [];
    component.diaSelecionado.subscribe(d => emitido.push(d));
    (el.querySelectorAll('.celula-dia')[10] as HTMLElement).click();
    expect(emitido.length).toBe(1);
    expect(emitido[0]).toBe(component.diasCalendario[10]);
  });

  it('clicar na consulta emite só a consulta (não seleciona o dia)', () => {
    const c = consulta(1, '2026-11-06T09:00:00');
    const el = render([c]);
    const dias: any[] = [];
    const consultas: any[] = [];
    component.diaSelecionado.subscribe(d => dias.push(d));
    component.consultaAberta.subscribe(x => consultas.push(x));
    (el.querySelector('.evento-chip') as HTMLElement).click();
    expect(consultas).toEqual([c]);
    expect(dias).toEqual([]);
  });
});
