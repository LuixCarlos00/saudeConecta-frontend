import { TestBed } from '@angular/core/testing';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { formatarDataLocal } from 'src/app/shared/utils/data-local';
import { DetalheAssinaturaComponent } from './detalhe-assinatura.component';

describe('DetalheAssinaturaComponent - datas de vencimento', () => {
  let componente: DetalheAssinaturaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DetalheAssinaturaComponent, { provide: AssinaturaApiService, useValue: {} }],
    });
    componente = TestBed.inject(DetalheAssinaturaComponent);
  });

  function comVencimento(dias: number): void {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    componente.assinatura = { status: 'TRIAL', dataVencimento: formatarDataLocal(d) } as any;
  }

  it('no dia do vencimento mostra 0 (último dia), sem número negativo', () => {
    comVencimento(0);
    expect(componente.diasRestantesTrial).toBe(0);
  });

  it('conta dias de calendário até o vencimento', () => {
    comVencimento(1);
    expect(componente.diasRestantesTrial).toBe(1);
    comVencimento(10);
    expect(componente.diasRestantesTrial).toBe(10);
  });

  it('após o vencimento não fica negativo; sem data devolve 0', () => {
    comVencimento(-3);
    expect(componente.diasRestantesTrial).toBe(0);
    componente.assinatura = null;
    expect(componente.diasRestantesTrial).toBe(0);
  });

  it('formatarData não recua um dia', () => {
    expect((componente as any).formatarData('2026-12-05')).toBe('05/12/2026');
    expect((componente as any).formatarData(null)).toBe('o fim do período atual');
  });
});
