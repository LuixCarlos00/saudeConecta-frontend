import { formatarDataLocal, parseDataLocal } from './data-local';

describe('formatarDataLocal', () => {
  it('formata yyyy-MM-dd com zero à esquerda', () => {
    expect(formatarDataLocal(new Date(2026, 0, 5, 10, 0))).toBe('2026-01-05');
  });

  it('às 23:30 locais continua no mesmo dia (toISOString viraria o dia seguinte em UTC-3)', () => {
    expect(formatarDataLocal(new Date(2026, 10, 4, 23, 30))).toBe('2026-11-04');
  });

  it('às 00:10 locais continua no mesmo dia', () => {
    expect(formatarDataLocal(new Date(2026, 10, 4, 0, 10))).toBe('2026-11-04');
  });

  it('vira o ano corretamente', () => {
    expect(formatarDataLocal(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31');
  });
});

describe('parseDataLocal', () => {
  it('interpreta como meia-noite local', () => {
    const d = parseDataLocal('2026-11-04')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 4, 0]);
  });

  it('aceita sufixo de hora', () => {
    expect(formatarDataLocal(parseDataLocal('2026-11-04T10:00:00')!)).toBe('2026-11-04');
  });

  it('retorna null para texto inválido ou data inexistente', () => {
    expect(parseDataLocal('abc')).toBeNull();
    expect(parseDataLocal('2026-02-31')).toBeNull();
    expect(parseDataLocal('')).toBeNull();
  });
});
