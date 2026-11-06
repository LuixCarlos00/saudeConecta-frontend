import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { HistoricoCompletoComponent } from './historico-completo.component';
import {
  IMPORTS_TESTE_PADRAO,
  PROVIDERS_TESTE_PADRAO,
  SCHEMAS_TESTE_PADRAO,
} from '../../../../testing/configuracao-teste';

describe('HistoricoCompletoComponent', () => {
  let fixture: ComponentFixture<HistoricoCompletoComponent>;
  let texto: string;

  const registroMedico = {
    tipoProntuario: 'MEDICO',
    consultaId: 677,
    codigoProntuario: '345',
    dataHora: '2026-10-02T09:30:00',
    status: 'PAGO',
    profissionalNome: 'Dra. Bruna Costa Machado',
    profissionalCrm: 'CRM-SP 135836',
    pacienteNome: 'Sandra Oliveira Machado',
    altura: '1.58',
    pulso: '95',
    hemoglobina: '15.1',
    frequenciaRespiratoria: '12',
    orientacoes: 'Manter acompanhamento anual.',
    cidTexto: 'Z01.4 - Exame ginecológico (geral) (de rotina)',
    tussTexto: '10101012 - Consulta em consultório',
    solicitacaoExameTexto: 'Colpocitologia oncótica; Mamografia.',
    dataFinalizado: '2026-10-02',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoricoCompletoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO,
        { provide: MAT_DIALOG_DATA, useValue: { pacienteId: 115 } },
        { provide: ConsultaApiService, useValue: { BuscandoHistoricoDeConsultasDoPaciente: () => of([registroMedico]) } },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricoCompletoComponent);
    fixture.detectChanges();
    texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
  });

  it('exibe na consulta médica os campos que o registro individual já mostrava', () => {
    expect(texto).toContain('Pulso: 95 bpm');
    expect(texto).toContain('Hb: 15.1');
    expect(texto).toContain('Fr. Resp.: 12');
    expect(texto).toContain('Orientações: Manter acompanhamento anual.');
    expect(texto).toContain('CID: Z01.4 - Exame ginecológico (geral) (de rotina)');
    expect(texto).toContain('TUSS: 10101012 - Consulta em consultório');
    expect(texto).toContain('Solicitação de Exames: Colpocitologia oncótica; Mamografia.');
  });

  it('mostra altura em metros e a data de finalização no formato brasileiro', () => {
    expect(texto).toContain('Altura: 1.58 m');
    expect(texto).not.toContain('1.58 cm');
    expect(texto).toContain('Data Finalização: 02/10/2026');
  });

  it('não duplica o título quando o nome já começa com Dr./Dra.', () => {
    expect(texto).toContain('Médico: Dra. Bruna Costa Machado');
    expect(texto).not.toContain('Dr(a). Dra.');
  });

  it('prefixoTitulo: adiciona Dr(a). só para nome sem título', () => {
    const c = fixture.componentInstance;
    expect(c.prefixoTitulo('Bruna Costa')).toBe('Dr(a). ');
    expect(c.prefixoTitulo('Dr. Carlos')).toBe('');
    expect(c.prefixoTitulo('dra Ana')).toBe('');
    expect(c.prefixoTitulo('Draco Lima')).toBe('Dr(a). ');
    expect(c.prefixoTitulo(null)).toBe('');
  });
});
