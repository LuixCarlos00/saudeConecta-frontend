import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

import { AgendarConsultaComponent } from './agendar-consulta.component';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import {
  IMPORTS_TESTE_PADRAO,
  PROVIDERS_TESTE_PADRAO,
  SCHEMAS_TESTE_PADRAO,
} from 'src/app/testing/configuracao-teste';

describe('AgendarConsultaComponent', () => {
  let component: AgendarConsultaComponent;
  let fixture: ComponentFixture<AgendarConsultaComponent>;
  let atualizarConsulta: jasmine.Spy;

  const consultaOriginal = {
    id: 10,
    profissionalId: 2,
    pacienteId: 3,
    dataHora: '2026-05-10T09:00:00',
    especialidadeId: 1,
    duracaoMinutos: 30,
    formaPagamentoId: 2,
    valor: 150,
    observacoes: '',
  };

  beforeEach(async () => {
    atualizarConsulta = jasmine.createSpy('atualizarConsultabyOrg').and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [AgendarConsultaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO.filter((p) => p.provide !== MAT_DIALOG_DATA),
        { provide: MAT_DIALOG_DATA, useValue: { consulta: consultaOriginal } },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarConsultaComponent);
    component = fixture.componentInstance;
    (component as any).consultaApi = { atualizarConsultabyOrg: atualizarConsulta } as Partial<ConsultaApiService>;
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    fixture.detectChanges();
  });

  async function salvarComValor(valor: unknown): Promise<any> {
    component.FormularioConsulta.patchValue({ valor });
    await (component as any)._salvarEdicao();
    return atualizarConsulta.calls.mostRecent().args[1];
  }

  it('deve criar', () => {
    expect(component).toBeTruthy();
  });

  it('3.8: deve permitir zerar o valor na edição', async () => {
    const payload = await salvarComValor(0);
    expect(payload.valor).toBe(0);
  });

  it('3.8: deve manter o valor original quando o campo está vazio', async () => {
    const payload = await salvarComValor(null);
    expect(payload.valor).toBe(150);
  });

  it('3.8: deve enviar o valor informado', async () => {
    const payload = await salvarComValor('99.5');
    expect(payload.valor).toBe(99.5);
  });
});
