import {
  PeriodoEnumMediaTempo,
  PeriodoFiltroSaldo,
  agruparSaldoPor,
  calcularEspecialidadesCategoria,
  calcularEstatisticasMediaTempo,
  calcularIntervaloMediaTempo,
  calcularIntervaloPadronizado,
  calcularIntervaloSaldo,
  contarAgendamentosPorData,
  contarConsultasPorEspecialidade,
  corEspecialidadeCategoria,
  extrairDatasAgendamentos,
  extrairDatasConsultas,
  formatarDataAgendamentos,
  formatarMoeda,
  formatarTempo,
  validarIntervaloMediaTempo,
} from './dashboard-calculos';

/** Funções puras do dashboard (testes migrados da caracterização do componente). Datas sempre locais. */
describe('dashboard-calculos', () => {
  describe('calcularIntervaloPadronizado', () => {
    it('7, 30 e 60 dias contam para trás a partir de hoje', () => {
      const hoje = new Date(2026, 10, 6, 10);
      expect(calcularIntervaloPadronizado(1, hoje)).toEqual({ inicio: '2026-10-30', fim: '2026-11-06' });
      expect(calcularIntervaloPadronizado(2, hoje)).toEqual({ inicio: '2026-10-07', fim: '2026-11-06' });
      expect(calcularIntervaloPadronizado(3, hoje)).toEqual({ inicio: '2026-09-07', fim: '2026-11-06' });
    });

    it('virada de mês: 1º de março menos 7 dias cai em fevereiro', () => {
      expect(calcularIntervaloPadronizado(1, new Date(2026, 2, 1))).toEqual({ inicio: '2026-02-22', fim: '2026-03-01' });
    });

    it('virada de ano: 3 de janeiro menos 30 dias cai em dezembro', () => {
      expect(calcularIntervaloPadronizado(2, new Date(2026, 0, 3))).toEqual({ inicio: '2025-12-04', fim: '2026-01-03' });
    });

    it('ano bissexto: 1º de março de 2028 menos 7 dias é 23 de fevereiro', () => {
      expect(calcularIntervaloPadronizado(1, new Date(2028, 2, 1))).toEqual({ inicio: '2028-02-23', fim: '2028-03-01' });
    });

    it('após as 21h (UTC já no dia seguinte) a data continua a local', () => {
      expect(calcularIntervaloPadronizado(1, new Date(2026, 10, 6, 23, 30))).toEqual({ inicio: '2026-10-30', fim: '2026-11-06' });
    });

    it('opção desconhecida manda o início vazio', () => {
      expect(calcularIntervaloPadronizado(0, new Date(2026, 10, 6))).toEqual({ inicio: '', fim: '2026-11-06' });
    });

    it('não altera a data recebida', () => {
      const hoje = new Date(2026, 10, 6);
      calcularIntervaloPadronizado(3, hoje);
      expect(hoje.getTime()).toBe(new Date(2026, 10, 6).getTime());
    });
  });

  describe('consultas', () => {
    const consultas = [
      { especialidadeNome: 'Cardiologia' },
      { especialidadeNome: 'Cardiologia' },
      { conMedico: { medEspecialidade: 'Dermatologia' } },
      {},
    ];

    it('lista as datas usando dataHora ou conData e ignora consultas sem data', () => {
      expect(extrairDatasConsultas([
        { dataHora: '2026-11-01T09:00:00' },
        { conData: '2026-11-02' },
        { dataHora: null, conData: null },
        {},
      ])).toEqual(['2026-11-01T09:00:00', '2026-11-02']);
    });

    it('agrupa por especialidade: especialidadeNome, depois conMedico.medEspecialidade, depois "Não informado"', () => {
      expect(contarConsultasPorEspecialidade(consultas)).toEqual([
        { especialidade: 'Cardiologia', quantidade: 2 },
        { especialidade: 'Dermatologia', quantidade: 1 },
        { especialidade: 'Não informado', quantidade: 1 },
      ]);
    });

    it('mês vazio: nenhum grupo', () => {
      expect(contarConsultasPorEspecialidade([])).toEqual([]);
      expect(extrairDatasConsultas([])).toEqual([]);
    });
  });

  describe('agendamentos', () => {
    it('corta a hora e ignora itens sem data', () => {
      expect(extrairDatasAgendamentos([
        { dataHora: '2026-11-01T09:00:00' },
        { conData: '2026-11-02' },
        {},
      ])).toEqual(['2026-11-01', '2026-11-02']);
    });

    it('agrupa por dia e ordena do mais antigo ao mais novo (inclusive na virada de mês)', () => {
      expect(contarAgendamentosPorData(['2026-11-02', '2026-10-31', '2026-11-02', '2026-11-01'])).toEqual([
        { data: '2026-10-31', quantidade: 1 },
        { data: '2026-11-01', quantidade: 1 },
        { data: '2026-11-02', quantidade: 2 },
      ]);
    });

    it('mês vazio: sem grupos', () => {
      expect(contarAgendamentosPorData([])).toEqual([]);
    });

    it('formata o rótulo como DD/MM; texto fora do padrão volta igual; vazio volta vazio', () => {
      expect(formatarDataAgendamentos('2026-11-06')).toBe('06/11');
      expect(formatarDataAgendamentos('06/11')).toBe('06/11');
      expect(formatarDataAgendamentos('')).toBe('');
    });
  });

  describe('saldo financeiro', () => {
    const hoje = new Date(2026, 1, 15);

    it('este mês: do dia 1 até hoje', () => {
      expect(calcularIntervaloSaldo(PeriodoFiltroSaldo.ESTE_MES, hoje)).toEqual({ inicio: '2026-02-01', fim: '2026-02-15' });
    });

    it('3 meses: dia 1 de dois meses atrás', () => {
      expect(calcularIntervaloSaldo(PeriodoFiltroSaldo.ULTIMOS_3_MESES, hoje)).toEqual({ inicio: '2025-12-01', fim: '2026-02-15' });
    });

    it('6 meses: dia 1 de cinco meses atrás', () => {
      expect(calcularIntervaloSaldo(PeriodoFiltroSaldo.ULTIMOS_6_MESES, hoje)).toEqual({ inicio: '2025-09-01', fim: '2026-02-15' });
    });

    it('este ano: 1º de janeiro', () => {
      expect(calcularIntervaloSaldo(PeriodoFiltroSaldo.ESTE_ANO, hoje)).toEqual({ inicio: '2026-01-01', fim: '2026-02-15' });
    });

    it('virada de ano: 3 meses em janeiro começam em novembro do ano anterior', () => {
      expect(calcularIntervaloSaldo(PeriodoFiltroSaldo.ULTIMOS_3_MESES, new Date(2026, 0, 10))).toEqual({ inicio: '2025-11-01', fim: '2026-01-10' });
    });

    it('agrupa por semana só em "este mês"; nos demais, por mês', () => {
      expect(agruparSaldoPor(PeriodoFiltroSaldo.ESTE_MES)).toBe('semana');
      expect(agruparSaldoPor(PeriodoFiltroSaldo.ULTIMOS_3_MESES)).toBe('mes');
      expect(agruparSaldoPor(PeriodoFiltroSaldo.ULTIMOS_6_MESES)).toBe('mes');
      expect(agruparSaldoPor(PeriodoFiltroSaldo.ESTE_ANO)).toBe('mes');
    });

    it('formata moeda em reais; nulo vira R$ 0,00', () => {
      const normalizar = (s: string) => s.replace(/ /g, ' ');
      expect(normalizar(formatarMoeda(1234.5))).toBe('R$ 1.234,50');
      expect(normalizar(formatarMoeda(null as any))).toBe('R$ 0,00');
      expect(normalizar(formatarMoeda(0))).toBe('R$ 0,00');
    });
  });

  describe('clínicos por especialidade', () => {
    it('conta, calcula o percentual arredondado e ordena do maior para o menor', () => {
      expect(calcularEspecialidadesCategoria([
        { especialidades: [{ nome: 'Cardiologia' }] },
        { especialidades: [{ nome: 'Cardiologia' }] },
        { medEspecialidade: 'Dermatologia' },
        {},
      ])).toEqual([
        { nome: 'Cardiologia', quantidade: 2, percentual: 50 },
        { nome: 'Dermatologia', quantidade: 1, percentual: 25 },
        { nome: 'Não informado', quantidade: 1, percentual: 25 },
      ]);
    });

    it('arredonda o percentual (1 de 3 = 33%, 2 de 3 = 67%)', () => {
      const resultado = calcularEspecialidadesCategoria([{ medEspecialidade: 'A' }, { medEspecialidade: 'B' }, { medEspecialidade: 'B' }]);
      expect(resultado.map(e => e.percentual)).toEqual([67, 33]);
    });

    it('lista vazia: nenhuma especialidade', () => {
      expect(calcularEspecialidadesCategoria([])).toEqual([]);
    });

    it('cor gira na paleta de 12 cores', () => {
      expect(corEspecialidadeCategoria(0)).toBe('rgba(59, 130, 246, 0.75)');
      expect(corEspecialidadeCategoria(12)).toBe('rgba(59, 130, 246, 0.75)');
      expect(corEspecialidadeCategoria(11)).toBe('rgba(14, 165, 233, 0.75)');
    });
  });

  describe('tempo médio de consulta', () => {
    it('vazio ou nulo: tudo zero', () => {
      const zero = { mediaTempo: 0, totalConsultas: 0, tempoMinimo: 0, tempoMaximo: 0 };
      expect(calcularEstatisticasMediaTempo([])).toEqual(zero);
      expect(calcularEstatisticasMediaTempo(null as any)).toEqual(zero);
    });

    it('média com 1 casa decimal, total, mínimo e máximo', () => {
      expect(calcularEstatisticasMediaTempo([10, 20, 40])).toEqual({ mediaTempo: 23.3, totalConsultas: 3, tempoMinimo: 10, tempoMaximo: 40 });
      expect(calcularEstatisticasMediaTempo([30])).toEqual({ mediaTempo: 30, totalConsultas: 1, tempoMinimo: 30, tempoMaximo: 30 });
    });

    it('períodos 7, 30 e 60 dias; virada de mês', () => {
      const hoje = new Date(2026, 2, 1);
      expect(calcularIntervaloMediaTempo(PeriodoEnumMediaTempo.SETE_DIAS, hoje)).toEqual({ inicio: '2026-02-22', fim: '2026-03-01' });
      expect(calcularIntervaloMediaTempo(PeriodoEnumMediaTempo.TRINTA_DIAS, hoje)).toEqual({ inicio: '2026-01-30', fim: '2026-03-01' });
      expect(calcularIntervaloMediaTempo(PeriodoEnumMediaTempo.SESSENTA_DIAS, hoje)).toEqual({ inicio: '2025-12-31', fim: '2026-03-01' });
    });

    it('período personalizado não recua: início = fim = hoje', () => {
      expect(calcularIntervaloMediaTempo(PeriodoEnumMediaTempo.PERSONALIZADO, new Date(2026, 10, 6))).toEqual({ inicio: '2026-11-06', fim: '2026-11-06' });
    });

    it('valida o intervalo personalizado', () => {
      expect(validarIntervaloMediaTempo(null as any, new Date(2026, 9, 1))).toBe('Selecione as datas de início e fim.');
      expect(validarIntervaloMediaTempo(new Date(2026, 9, 10), new Date(2026, 9, 1))).toBe('A data de início deve ser anterior à data de fim.');
      expect(validarIntervaloMediaTempo(new Date(2025, 0, 1), new Date(2026, 5, 1))).toBe('O intervalo não pode ser maior que 365 dias.');
      expect(validarIntervaloMediaTempo(new Date(2026, 9, 1), new Date(2026, 9, 31))).toBeNull();
    });

    it('formata minutos: abaixo de 60 em "min"; acima em horas e minutos', () => {
      expect(formatarTempo(45)).toBe('45 min');
      expect(formatarTempo(59.6)).toBe('60 min');
      expect(formatarTempo(60)).toBe('1h 0min');
      expect(formatarTempo(90)).toBe('1h 30min');
      expect(formatarTempo(125.6)).toBe('2h 6min');
    });
  });
});
