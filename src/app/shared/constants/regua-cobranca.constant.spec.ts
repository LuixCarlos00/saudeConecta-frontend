import { formatarDataLocal } from 'src/app/shared/utils/data-local';
import { calcularDataSuspensao, DIAS_ATE_SUSPENSAO } from './regua-cobranca.constant';

describe('régua de cobrança', () => {
  it('suspensão é vencimento + 15 dias (igual ao CobrancaScheduler do back)', () => {
    expect(DIAS_ATE_SUSPENSAO).toBe(15);
    expect(formatarDataLocal(calcularDataSuspensao('2026-12-05')!)).toBe('2026-12-20');
  });

  it('atravessa virada de mês e de ano', () => {
    expect(formatarDataLocal(calcularDataSuspensao('2026-12-25')!)).toBe('2027-01-09');
  });

  it('devolve null para vencimento nulo ou inválido', () => {
    expect(calcularDataSuspensao(null)).toBeNull();
    expect(calcularDataSuspensao('x')).toBeNull();
  });
});
