/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EditarConsultasComponent } from './Editar-Consultas.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../../testing/configuracao-teste';

describe('EditarConsultasComponent', () => {
  let component: EditarConsultasComponent;
  let fixture: ComponentFixture<EditarConsultasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditarConsultasComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('forma de pagamento (3.5)', () => {
    it('deve renderizar um radio por forma de pagamento com os ids do banco', () => {
      const radios = fixture.nativeElement.querySelectorAll('input[formControlName="formaPagamento"]');
      const rotulos = Array.from(
        fixture.nativeElement.querySelectorAll('.payment-option span')
      ).map((el: any) => el.textContent.trim());
      expect(radios.length).toBe(6);
      expect(rotulos).toEqual(['Particular', 'Convênio', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Dinheiro']);
    });

    it('obterTextoPagamento deve usar o mapeamento único', () => {
      const texto = (id: number) => (component as any).obterTextoPagamento(id);
      expect(texto(1)).toBe('Particular');
      expect(texto(4)).toBe('Cartão de Débito');
      expect(texto(5)).toBe('PIX');
      expect(texto(6)).toBe('Dinheiro');
      expect(texto(99)).toBe('Não informado');
    });
  });

  describe('horários disponíveis', () => {
    function prepararBusca(ocupados: string[]) {
      (component as any).consultaApi = {
        buscarHorariosOcupadosByOrg: () => of(ocupados),
      };
      component.consulta = { ...component.consulta, profissionalId: 1, dataHora: '2026-05-10T09:00:00' } as any;
      component.medicoSelecionado = null;
    }

    it('3.6: só libera o horário da consulta original quando a data é a mesma', async () => {
      prepararBusca(['09:00:00']);
      await (component as any).buscarHorariosDisponiveis('2026-05-10');
      expect(component.Hora.map((h: any) => h.value.substring(0, 5))).toContain('09:00');

      prepararBusca(['09:00:00']);
      await (component as any).buscarHorariosDisponiveis('2026-05-11');
      expect(component.Hora.map((h: any) => h.value.substring(0, 5))).not.toContain('09:00');
    });

    it('3.7: usa o tempo de consulta do profissional como duração dos horários ocupados', () => {
      // Ocupados 09:00 e 11:00 com consultas de 30 min: 10:00 deve continuar livre.
      (component as any).gerarHorariosRespeitandoOcupados(30, ['09:00:00', '11:00:00']);
      const horas = component.Hora.map((h: any) => h.value);
      expect(horas).toContain('10:00');
      expect(horas).not.toContain('09:00');
      expect(horas).not.toContain('11:00');
    });
  });
});
