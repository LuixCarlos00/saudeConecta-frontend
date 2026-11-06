import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { gerarHorasDia } from '../agenda-calendario.calculos';
import { TotalConsultasDiaPipe } from '../total-consultas-dia.pipe';
import { AgendaVisaoDiaComponent } from './agenda-visao-dia.component';

describe('AgendaVisaoDiaComponent', () => {
  let fixture: ComponentFixture<AgendaVisaoDiaComponent>;
  let component: AgendaVisaoDiaComponent;
  const consulta = (id: number, hora: string): any => ({
    id, dataHora: `2026-11-06T${hora}:00`, status: 'CONFIRMADA', pacienteNome: `Paciente ${id}`,
    especialidadeNome: 'Cardiologia', profissionalNome: 'Dra. Ana',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgendaVisaoDiaComponent, TotalConsultasDiaPipe],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();
    fixture = TestBed.createComponent(AgendaVisaoDiaComponent);
    component = fixture.componentInstance;
    component.dataAtual = new Date(2026, 10, 6);
    component.horasDia = gerarHorasDia(component.dataAtual, [consulta(1, '09:00'), consulta(2, '09:30')]);
  });

  it('mostra o título do dia, 13 faixas de hora e as consultas na hora certa', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dia-nome-completo')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('Sex, 6 de Novembro');
    expect(el.querySelectorAll('.slot-dia').length).toBe(13);
    const faixa9 = el.querySelectorAll('.slot-dia')[2];
    expect(faixa9.querySelector('.hora-label')!.textContent!.trim()).toBe('09:00');
    expect(faixa9.querySelectorAll('.evento-card-dia').length).toBe(2);
    expect(faixa9.querySelector('.evento-status-badge')!.textContent!.trim()).toBe('Confirmada');
  });

  it('mostra o total de consultas do dia', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.total-consultas').textContent.trim()).toBe('2 consultas');
  });

  it('o nome do profissional só aparece para quem vê todos', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.evento-medico')).toBeNull();
  });

  it('o nome do profissional aparece para quem vê todos', () => {
    component.podeVerTodosProfissionais = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.evento-medico').textContent.trim()).toBe('Dra. Ana');
  });

  it('clicar na consulta emite a consulta', () => {
    fixture.detectChanges();
    const emitidas: any[] = [];
    component.consultaAberta.subscribe(c => emitidas.push(c));
    (fixture.nativeElement.querySelector('.evento-card-dia') as HTMLElement).click();
    expect(emitidas.map(c => c.id)).toEqual([1]);
  });
});
