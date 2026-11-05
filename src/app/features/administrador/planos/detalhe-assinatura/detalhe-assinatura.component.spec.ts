import { TestBed } from '@angular/core/testing';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { formatarDataLocal } from 'src/app/shared/utils/data-local';
import { DetalheAssinaturaComponent } from './detalhe-assinatura.component';

describe('DetalheAssinaturaComponent - datas de vencimento', () => {
  let componente: DetalheAssinaturaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DetalheAssinaturaComponent,
        { provide: AssinaturaApiService, useValue: {} },
        { provide: ControleAcessoApiService, useValue: { podeGerenciarAdministrador: () => true } },
      ],
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

describe('DetalheAssinaturaComponent - permissões de pagamento', () => {
  function criar(admin: boolean, status: string): DetalheAssinaturaComponent {
    TestBed.configureTestingModule({
      providers: [
        DetalheAssinaturaComponent,
        { provide: AssinaturaApiService, useValue: {} },
        { provide: ControleAcessoApiService, useValue: { podeGerenciarAdministrador: () => admin } },
      ],
    });
    const c = TestBed.inject(DetalheAssinaturaComponent);
    c.assinatura = { status, cortesia: false, dataVencimento: '2026-12-05' } as any;
    return c;
  }

  it('ADMIN inadimplente vê pagar e cancelar, sem aviso', () => {
    const c = criar(true, 'INADIMPLENTE');
    expect(c.podeAtivar).toBeTrue();
    expect(c.podeCancelar).toBeTrue();
    expect(c.avisoSomenteLeitura).toBeFalse();
  });

  it('Secretária inadimplente não vê botões e recebe o aviso', () => {
    const c = criar(false, 'INADIMPLENTE');
    expect(c.podeAtivar).toBeFalse();
    expect(c.podeCancelar).toBeFalse();
    expect(c.avisoSomenteLeitura).toBeTrue();
  });

  it('Secretária com assinatura ativa não vê botões nem aviso', () => {
    const c = criar(false, 'ATIVA');
    expect(c.podeAtivar).toBeFalse();
    expect(c.podeCancelar).toBeFalse();
    expect(c.avisoSomenteLeitura).toBeFalse();
  });
});
