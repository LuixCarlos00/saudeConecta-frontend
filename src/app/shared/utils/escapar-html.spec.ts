import { escaparHtml } from './escapar-html';

describe('escaparHtml', () => {
  it('escapa tags e aspas', () => {
    expect(escaparHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('escapa & e apóstrofo', () => {
    expect(escaparHtml(`Tom & Jerry's`)).toBe('Tom &amp; Jerry&#39;s');
  });

  it('retorna vazio para null e undefined', () => {
    expect(escaparHtml(null)).toBe('');
    expect(escaparHtml(undefined)).toBe('');
  });

  it('converte números e mantém texto simples', () => {
    expect(escaparHtml(12)).toBe('12');
    expect(escaparHtml('Maria José')).toBe('Maria José');
  });
});
