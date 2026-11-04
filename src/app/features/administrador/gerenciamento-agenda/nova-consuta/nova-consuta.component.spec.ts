/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { NovaConsultaComponent } from './nova-consuta.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';


describe('NovaConsultaComponent', () => {
  let component: NovaConsultaComponent;
  let fixture: ComponentFixture<NovaConsultaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NovaConsultaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovaConsultaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('3.7: usa o tempo de consulta do médico como duração dos horários ocupados', () => {
    // Ocupados 09:00 e 11:00 com consultas de 30 min: 10:00 deve continuar livre.
    component.generateAvailableTimesRespeitandoOcupados(30, [
      { inicio: '09:00:00', duracaoMinutos: 30 }, { inicio: '11:00:00', duracaoMinutos: 30 }]);
    const horas = component.Hora.map((h: any) => h.value);
    expect(horas).toContain('10:00');
    expect(horas).not.toContain('09:00');
    expect(horas).not.toContain('11:00');
  });

  it('bloqueia o intervalo real de uma consulta longa (60 min) com slots de 30', () => {
    component.generateAvailableTimesRespeitandoOcupados(30, [{ inicio: '09:00:00', duracaoMinutos: 60 }]);
    const horas = component.Hora.map((h: any) => h.value);
    expect(horas).not.toContain('09:00');
    expect(horas).not.toContain('09:30');
    expect(horas).toContain('10:00');
  });

  it('busca horários ocupados pela fonte detalhada usando o tempo do médico como fallback', () => {
    const buscar = jasmine.createSpy('buscarHorariosOcupadosComDuracao')
      .and.returnValue(of([{ inicio: '09:00:00', duracaoMinutos: 60 }]));
    (component as any).consultaApi = { buscarHorariosOcupadosComDuracao: buscar };
    component.Medico = { id: 1, tempoConsultaMinutos: 20 } as any;
    component.verificarCondicoesParaConsulta(new Date('2026-11-10T12:00:00'));
    expect(buscar).toHaveBeenCalledWith(1, jasmine.anything(), 20);
    expect(component.Hora.map((h: any) => h.value)).not.toContain('09:20');
  });

  it('transformaFormaPagamento deve usar os ids do banco', () => {
    component.FormularioConsulta.patchValue({ Pagamento: 'PIX' });
    expect(component.transformaFormaPagamento()).toBe(5);
    component.FormularioConsulta.patchValue({ Pagamento: 'Dinheiro' });
    expect(component.transformaFormaPagamento()).toBe(6);
  });

  describe('marcarConsulta - verificarDisponibilidade', () => {
    let verificar: jasmine.Spy;
    let cadastrar: jasmine.Spy;
    let dialogJaExiste: jasmine.Spy;

    beforeEach(() => {
      verificar = jasmine.createSpy('verificarDisponibilidadeByOrg');
      cadastrar = jasmine.createSpy('cadastrarConsultaByOrg');
      (component as any).consultaApi = { verificarDisponibilidadeByOrg: verificar, cadastrarConsultaByOrg: cadastrar };
      dialogJaExiste = spyOn((component as any).DialogService, 'JaexisteDadosCAdastradosComEssesParamentros');
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
      spyOn(console, 'error');
      component.Medico = { id: 1, especialidades: [{ id: 1 }] } as any;
      component.Paciente = { codigo: 2 } as any;
      component.DataSelecionada = '2026-11-10';
      component.FormularioConsulta.patchValue({ Pagamento: 'PIX', Hora: '09:00', valor: '100' });
    });

    it('erro de rede/500 mostra erro genérico, não "horário ocupado" e NÃO limpa o form', async () => {
      verificar.and.returnValue(throwError(() => ({ status: 500 })));
      await component.marcarConsulta();
      expect(dialogJaExiste).not.toHaveBeenCalled();
      expect(cadastrar).not.toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error' }));
      expect(component.FormularioConsulta.get('Hora')?.value).toBe('09:00');
    });

    it('erro 409/400 ao criar consulta mostra a mensagem do back', async () => {
      verificar.and.returnValue(of(false));
      cadastrar.and.returnValue(throwError(() => ({ status: 409, error: 'Conflito de horario' })));
      await component.marcarConsulta();
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Conflito de horario' }));
    });

    it('erro 500 sem corpo ao criar consulta usa mensagem padrão', async () => {
      verificar.and.returnValue(of(false));
      cadastrar.and.returnValue(throwError(() => ({ status: 500 })));
      await component.marcarConsulta();
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Algo deu errado. Tente novamente mais tarde.' }));
    });

    it('horário ocupado (true) mostra aviso de duplicidade e limpa o form', async () => {
      verificar.and.returnValue(of(true));
      await component.marcarConsulta();
      expect(dialogJaExiste).toHaveBeenCalled();
      expect(cadastrar).not.toHaveBeenCalled();
    });
  });
});
