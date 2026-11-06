import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { RegistroConsulataMedicoComponent } from './registro-consulta-medico.component';
import {
  IMPORTS_TESTE_PADRAO,
  PROVIDERS_TESTE_PADRAO,
  SCHEMAS_TESTE_PADRAO,
} from '../../../../testing/configuracao-teste';

/** Prontuário 345 da massa de demonstração, no formato de /prontuario/buscarProntuarioById. */
const PRONTUARIO = {
  codigoProntuario: 345,
  saturacao: '96',
  pulso: '95',
  prescricao: 'Ácido fólico 5 mg - 1 comprimido ao dia.',
  tituloPrescricao: 'Suplementação',
  profissional: { id: 4, nome: 'Dra. Bruna Costa Machado', conselho: 'CRM-SP 135836' },
  consulta: {
    id: 677,
    dataHora: '2026-10-02T09:30:00',
    status: 'PAGO',
    paciente: { nome: 'Sandra Oliveira Machado', cpf: '41923494937', dataNascimento: '2005-08-09' },
  },
  planejamentos: [
    { dataProcedimento: '2026-10-02', procedimentoRealizado: 'Coleta de colpocitologia oncótica', valor: 90, statusAssinatura: 'ASSINADO' },
  ],
};

describe('RegistroConsulataMedicoComponent', () => {
  let fixture: ComponentFixture<RegistroConsulataMedicoComponent>;
  let componente: RegistroConsulataMedicoComponent;

  function criar(dados: any): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: dados });
    fixture = TestBed.createComponent(RegistroConsulataMedicoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistroConsulataMedicoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();
  });

  it('tela: título do médico uma vez, prescrição com título e datas dd/MM/yyyy', () => {
    criar(PRONTUARIO);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Nome: Dra. Bruna Costa Machado');
    expect(texto).not.toContain('Dr. Dra.');
    expect(texto).toContain('Prescrição — Suplementação: Ácido fólico 5 mg');
    expect(texto).toContain('09/08/2005');
    expect(texto).not.toContain('2005-08-09');
    expect(texto).toContain('02/10/2026');
    expect(texto).not.toContain('2026-10-02');
  });

  it('nome sem título recebe "Dr(a)." e prescrição sem título usa o rótulo simples', () => {
    criar({ ...PRONTUARIO, tituloPrescricao: null, profissional: { nome: 'Bruna Costa' } });

    expect(componente.nomeMedicoComTitulo).toBe('Dr(a). Bruna Costa');
    expect(componente.rotuloPrescricao).toBe('Prescrição:');
  });

  it('PDF: escreve SpO2 sem subscrito, nome sem título duplicado e datas dd/MM/yyyy', () => {
    criar(PRONTUARIO);
    const pdf = componente.montarPDF().output();

    expect(pdf).toContain('(SpO2: )');
    expect(pdf).toContain('Dra. Bruna Costa Machado');
    expect(pdf).not.toContain('Dr. Dra.');
    expect(pdf).toContain('Suplementa'); // título da prescrição (o "ç" sai codificado no PDF)
    expect(pdf).toContain('09/08/2005');
    expect(pdf).toContain('02/10/2026');
    expect(pdf).not.toContain('2026-10-02');
  });
});
