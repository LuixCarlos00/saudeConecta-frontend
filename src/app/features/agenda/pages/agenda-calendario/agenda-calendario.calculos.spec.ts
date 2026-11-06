import {
  classeStatus,
  deslocarPeriodo,
  etapaConcluida,
  extrairProfissionaisEEspecialidades,
  filtrarConsultas,
  FiltrosAgenda,
  gerarDiasMes,
  gerarDiasSemana,
  gerarHorasDia,
  horarioLocal,
  inicioDaSemana,
  legendaDoTipo,
  podeEditarConsultaPorPerfil,
  temRascunho,
  tituloDoPeriodo,
} from './agenda-calendario.calculos';

/** Funções puras da agenda (testes migrados da caracterização do componente). Datas sempre locais. */
describe('agenda-calendario.calculos', () => {
  const consulta = (id: number, dataHora: string, extra: any = {}): any => ({
    id, dataHora, status: 'AGENDADA', profissionalId: 1, profissionalNome: 'Dra. Ana',
    especialidadeNome: 'Cardiologia', pacienteNome: 'Maria', ...extra,
  });
  const formatar = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoje = new Date(2026, 10, 6, 10);

  describe('título e navegação', () => {
    it('mês: "Mês Ano"', () => {
      expect(tituloDoPeriodo('mes', new Date(2026, 10, 6))).toBe('Novembro 2026');
    });

    it('semana: do domingo ao sábado, atravessando o mês', () => {
      expect(tituloDoPeriodo('semana', new Date(2026, 10, 6))).toBe('1/11 – 7/11/2026');
    });

    it('semana na virada do ano', () => {
      expect(tituloDoPeriodo('semana', new Date(2026, 0, 1))).toBe('28/12 – 3/1/2026');
    });

    it('dia: "D de Mês de Ano"', () => {
      expect(tituloDoPeriodo('dia', new Date(2026, 2, 5))).toBe('5 de Março de 2026');
    });

    it('mês anterior/próximo vai para o dia 1 (de 31/03 volta a fevereiro, não a março)', () => {
      expect(deslocarPeriodo('mes', new Date(2026, 2, 31), -1)).toEqual(new Date(2026, 1, 1));
      expect(deslocarPeriodo('mes', new Date(2026, 2, 31), 1)).toEqual(new Date(2026, 3, 1));
      expect(deslocarPeriodo('mes', new Date(2026, 11, 15), 1)).toEqual(new Date(2027, 0, 1));
    });

    it('semana anda 7 dias e dia anda 1, atravessando mês e ano', () => {
      expect(deslocarPeriodo('semana', new Date(2026, 0, 3), -1)).toEqual(new Date(2025, 11, 27));
      expect(deslocarPeriodo('dia', new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 31));
      expect(deslocarPeriodo('dia', new Date(2025, 11, 31), 1)).toEqual(new Date(2026, 0, 1));
    });

    it('não altera a data recebida', () => {
      const data = new Date(2026, 2, 31);
      deslocarPeriodo('semana', data, 1);
      expect(data).toEqual(new Date(2026, 2, 31));
    });

    it('início da semana é o domingo', () => {
      expect(inicioDaSemana(new Date(2026, 10, 6))).toEqual(new Date(2026, 10, 1));
      expect(inicioDaSemana(new Date(2026, 10, 1))).toEqual(new Date(2026, 10, 1));
    });
  });

  describe('grade do mês', () => {
    it('sempre 42 células; novembro de 2026 (começa no domingo) não tem dias do mês anterior', () => {
      const dias = gerarDiasMes(new Date(2026, 10, 1), [], hoje);
      expect(dias.length).toBe(42);
      expect(dias[0].data).toEqual(new Date(2026, 10, 1));
      expect(dias[0].mesAtual).toBeTrue();
      expect(dias[30].data).toEqual(new Date(2026, 11, 1));
      expect(dias[30].mesAtual).toBeFalse();
    });

    it('janeiro de 2026 (começa na quinta) completa com 4 dias de dezembro', () => {
      const dias = gerarDiasMes(new Date(2026, 0, 1), [], hoje);
      expect(dias.slice(0, 4).map(d => d.data.getDate())).toEqual([28, 29, 30, 31]);
      expect(dias.slice(0, 4).every(d => !d.mesAtual)).toBeTrue();
      expect(dias[4].data).toEqual(new Date(2026, 0, 1));
      expect(dias.filter(d => d.mesAtual).length).toBe(31);
    });

    it('fevereiro bissexto de 2028 tem 29 dias no mês', () => {
      expect(gerarDiasMes(new Date(2028, 1, 1), [], hoje).filter(d => d.mesAtual).length).toBe(29);
    });

    it('só o dia de hoje (dentro do mês) é marcado como hoje', () => {
      const hojes = gerarDiasMes(new Date(2026, 10, 1), [], hoje).filter(d => d.hoje);
      expect(hojes.length).toBe(1);
      expect(hojes[0].data).toEqual(new Date(2026, 10, 6));
    });

    it('as consultas caem no dia local, inclusive nos dias de fora do mês', () => {
      const dias = gerarDiasMes(new Date(2026, 10, 1), [
        consulta(1, '2026-11-06T09:00:00'),
        consulta(2, '2026-11-06T23:30:00'),
        consulta(3, '2026-12-01T08:00:00'),
      ], hoje);
      expect(dias.find(d => d.mesAtual && d.data.getDate() === 6)!.consultas.map(c => c.id)).toEqual([1, 2]);
      expect(dias.find(d => !d.mesAtual && d.data.getDate() === 1)!.consultas.map(c => c.id)).toEqual([3]);
    });

    it('mês vazio: nenhuma consulta em nenhuma célula', () => {
      expect(gerarDiasMes(new Date(2026, 10, 1), [], hoje).every(d => d.consultas.length === 0)).toBeTrue();
    });
  });

  describe('grade da semana', () => {
    it('7 dias de domingo a sábado, atravessando a virada de ano', () => {
      const dias = gerarDiasSemana(new Date(2026, 0, 1), [consulta(1, '2025-12-29T09:00:00'), consulta(2, '2026-01-03T09:00:00')], hoje);
      expect(dias.map(d => formatar(d.data))).toEqual([
        '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03',
      ]);
      expect(dias[1].consultas.map(c => c.id)).toEqual([1]);
      expect(dias[6].consultas.map(c => c.id)).toEqual([2]);
    });

    it('marca o dia de hoje', () => {
      const dias = gerarDiasSemana(new Date(2026, 10, 6), [], hoje);
      expect(dias.filter(d => d.hoje).map(d => formatar(d.data))).toEqual(['2026-11-06']);
    });
  });

  describe('grade do dia', () => {
    it('13 horas, de 07:00 a 19:00, com as consultas na hora certa', () => {
      const horas = gerarHorasDia(new Date(2026, 10, 6), [
        consulta(1, '2026-11-06T07:15:00'),
        consulta(2, '2026-11-06T07:45:00'),
        consulta(3, '2026-11-06T19:00:00'),
        consulta(4, '2026-11-06T20:00:00'),
        consulta(5, '2026-11-07T07:00:00'),
      ]);
      expect(horas.length).toBe(13);
      expect(horas[0].label).toBe('07:00');
      expect(horas[12].label).toBe('19:00');
      expect(horas[0].consultas.map(c => c.id)).toEqual([1, 2]);
      expect(horas[12].consultas.map(c => c.id)).toEqual([3]);
      expect(horas.reduce((s, h) => s + h.consultas.length, 0)).toBe(3);
    });
  });

  describe('filtros', () => {
    const todas = [
      consulta(1, '2026-11-06T09:00:00', { status: 'AGENDADA', profissionalId: 1, especialidadeNome: 'Cardiologia', pacienteNome: 'Maria Souza' }),
      consulta(2, '2026-11-06T10:00:00', { status: 'CONFIRMADA', profissionalId: 2, profissionalNome: 'Dr. Bruno', especialidadeNome: 'Dermatologia', pacienteNome: 'João Lima' }),
      consulta(3, '2026-11-06T11:00:00', { status: 'REALIZADA', profissionalId: 1, pacienteNome: 'Ana MARIA' }),
      consulta(4, '2026-11-06T12:00:00', { status: 'CANCELADA', profissionalId: 2, profissionalNome: 'Dr. Bruno', pacienteNome: 'Carlos' }),
      consulta(5, '2026-11-06T13:00:00', { status: 'PAGO', pacienteNome: 'Carlos' }),
      consulta(6, '2026-11-06T14:00:00', { status: 'FALTOU', pacienteNome: 'Carlos' }),
    ];
    const vazio: FiltrosAgenda = { finalizadas: false, status: [], profissional: '', especialidade: '', busca: '' };
    const ids = (f: Partial<FiltrosAgenda>) => filtrarConsultas(todas, { ...vazio, ...f }).map(c => c.id);

    it('por padrão mostra só agendadas e confirmadas', () => {
      expect(ids({})).toEqual([1, 2]);
    });

    it('"finalizadas" mostra realizada, paga e cancelada (faltou nunca aparece)', () => {
      expect(ids({ finalizadas: true })).toEqual([3, 4, 5]);
    });

    it('status selecionado restringe dentro do tipo', () => {
      expect(ids({ status: ['CONFIRMADA'] })).toEqual([2]);
      expect(ids({ status: ['PAGO'] })).toEqual([]);
    });

    it('profissional (id vindo do select como texto)', () => {
      expect(ids({ profissional: '2' })).toEqual([2]);
    });

    it('especialidade', () => {
      expect(ids({ especialidade: 'Dermatologia' })).toEqual([2]);
    });

    it('busca por paciente ignora maiúsculas e minúsculas', () => {
      expect(ids({ finalizadas: true, busca: 'maria' })).toEqual([3]);
      expect(ids({ busca: 'maria' })).toEqual([1]);
    });

    it('lista vazia: nada a mostrar', () => {
      expect(filtrarConsultas([], vazio)).toEqual([]);
    });

    it('a legenda segue o tipo: agendadas ou finalizadas', () => {
      expect(legendaDoTipo(false).map(s => s.value)).toEqual(['AGENDADA', 'CONFIRMADA']);
      expect(legendaDoTipo(true).map(s => s.value)).toEqual(['REALIZADA', 'CANCELADA', 'PAGO']);
    });

    it('as opções de profissional e especialidade vêm das consultas', () => {
      expect(extrairProfissionaisEEspecialidades(todas)).toEqual({
        profissionais: [{ id: 1, nome: 'Dra. Ana' }, { id: 2, nome: 'Dr. Bruno' }],
        especialidades: ['Cardiologia', 'Dermatologia'],
      });
    });
  });

  describe('status e horário', () => {
    it('classe de status; desconhecido vira vazio', () => {
      expect(classeStatus('AGENDADA')).toBe('status-agendada');
      expect(classeStatus('REMARCADA')).toBe('status-remarcada');
      expect(classeStatus('XPTO')).toBe('');
    });

    it('horário local HH:mm; vazio devolve vazio', () => {
      expect(horarioLocal('2026-11-06T09:05:00')).toBe('09:05');
      expect(horarioLocal('')).toBe('');
    });

    it('etapa concluída segue a ordem agendada, confirmada, realizada, paga', () => {
      expect(etapaConcluida('AGENDADA', 'CONFIRMADA')).toBeTrue();
      expect(etapaConcluida('AGENDADA', 'AGENDADA')).toBeFalse();
      expect(etapaConcluida('REALIZADA', 'PAGO')).toBeTrue();
      expect(etapaConcluida('CONFIRMADA', 'AGENDADA')).toBeFalse();
      expect(etapaConcluida('AGENDADA', 'CANCELADA')).toBeFalse();
    });

    it('editar: só admin edita agendada/confirmada; confirmada é bloqueada para admin e profissional', () => {
      expect(podeEditarConsultaPorPerfil('AGENDADA', true, false)).toBeTrue();
      expect(podeEditarConsultaPorPerfil('CONFIRMADA', true, false)).toBeFalse();
      expect(podeEditarConsultaPorPerfil('REALIZADA', true, false)).toBeFalse();
      expect(podeEditarConsultaPorPerfil('AGENDADA', false, true)).toBeFalse();
      expect(podeEditarConsultaPorPerfil('CONFIRMADA', false, true)).toBeFalse();
      expect(podeEditarConsultaPorPerfil('AGENDADA', false, false)).toBeFalse();
    });

    it('temRascunho só é verdadeiro para consulta com rascunho salvo', () => {
      const rascunhos = new Set([822]);
      expect(temRascunho(rascunhos, { id: 822 } as any)).toBeTrue();
      expect(temRascunho(rascunhos, { id: 1 } as any)).toBeFalse();
      expect(temRascunho(rascunhos, null)).toBeFalse();
      expect(temRascunho(rascunhos, undefined)).toBeFalse();
    });
  });
});
