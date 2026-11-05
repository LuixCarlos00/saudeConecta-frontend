import { diasCalendarioAte, formatarDataBr, formatarDataLocal, parseDataLocal } from './data-local';

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

describe('formatarDataBr', () => {
  it('não recua um dia (new Date("2026-12-05") viraria 04/12 em Brasília)', () => {
    expect(formatarDataBr('2026-12-05')).toBe('05/12/2026');
  });

  it('aceita string com hora', () => {
    expect(formatarDataBr('2026-12-05T10:00:00')).toBe('05/12/2026');
  });

  it('devolve o padrão para nulo, vazio ou inválido', () => {
    expect(formatarDataBr(null, 'fim do período')).toBe('fim do período');
    expect(formatarDataBr(undefined)).toBe('');
    expect(formatarDataBr('lixo', '-')).toBe('-');
  });
});

describe('diasCalendarioAte', () => {
  const hoje = new Date(2026, 10, 5, 23, 30);

  it('no dia do vencimento é 0, mesmo com hora avançada', () => {
    expect(diasCalendarioAte('2026-11-05', hoje)).toBe(0);
  });

  it('conta dias de calendário, ignorando a hora atual', () => {
    expect(diasCalendarioAte('2026-11-06', hoje)).toBe(1);
    expect(diasCalendarioAte('2026-11-06', new Date(2026, 10, 5, 0, 1))).toBe(1);
    expect(diasCalendarioAte('2026-12-05', hoje)).toBe(30);
  });

  it('devolve negativo após o vencimento', () => {
    expect(diasCalendarioAte('2026-11-04', hoje)).toBe(-1);
  });

  it('atravessa a virada de horário de verão sem errar', () => {
    expect(diasCalendarioAte('2026-11-02', new Date(2026, 9, 30, 12))).toBe(3);
  });

  it('devolve 0 para nulo ou inválido', () => {
    expect(diasCalendarioAte(null, hoje)).toBe(0);
    expect(diasCalendarioAte('x', hoje)).toBe(0);
  });
});
