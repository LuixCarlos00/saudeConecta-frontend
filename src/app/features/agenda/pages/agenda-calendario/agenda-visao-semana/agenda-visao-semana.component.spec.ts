import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { gerarDiasSemana, gerarHorasDia } from '../agenda-calendario.calculos';
import { AgendaVisaoSemanaComponent } from './agenda-visao-semana.component';

describe('AgendaVisaoSemanaComponent', () => {
  let fixture: ComponentFixture<AgendaVisaoSemanaComponent>;
  let component: AgendaVisaoSemanaComponent;
  const consulta = (id: number): any => ({ id, dataHora: '2026-11-06T09:00:00', status: 'CONFIRMADA', pacienteNome: `Paciente ${id}`, profissionalNome: 'Dra. Ana' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgendaVisaoSemanaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaVisaoSemanaComponent);
    component = fixture.componentInstance;
    const dataAtual = new Date(2026, 10, 6);
    component.diasSemana = gerarDiasSemana(dataAtual, [consulta(1)], new Date(2026, 10, 6));
    component.horasDia = gerarHorasDia(dataAtual, []);
  });

  it('desenha 7 colunas, 13 horários e a consulta no dia certo', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.dia-semana-col-header').length).toBe(7);
    expect(el.querySelectorAll('.slot-hora').length).toBe(13);
    const colunas = el.querySelectorAll('.col-dia-semana');
    expect(colunas[5].querySelectorAll('.slot-evento-semana').length).toBe(1);
    expect(colunas[5].querySelector('.evento-hora-semana')!.textContent!.trim()).toBe('09:00');
  });

  it('o nome do profissional não aparece para quem não vê todos', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.evento-prof-semana')).toBeNull();
  });

  it('o nome do profissional aparece para quem vê todos', () => {
    component.podeVerTodosProfissionais = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.evento-prof-semana').textContent.trim()).toBe('Dra. Ana');
  });

  it('clicar no cabeçalho emite o dia; clicar na consulta emite só a consulta', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const dias: any[] = [];
    const consultas: any[] = [];
    component.diaSelecionado.subscribe(d => dias.push(d));
    component.consultaAberta.subscribe(c => consultas.push(c));
    (el.querySelectorAll('.dia-semana-col-header')[2] as HTMLElement).click();
    expect(dias).toEqual([component.diasSemana[2]]);
    (el.querySelector('.slot-evento-semana') as HTMLElement).click();
    expect(consultas.length).toBe(1);
    expect(dias.length).toBe(1);
  });
});
