import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from 'src/app/core/auth/auth.service';
import { HistoricoRegistroCardComponent } from './historico-registro-card.component';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

/** Prontuário 345 da massa de demonstração, como vem de BuscandoHistoricoDeConsultasDoPaciente. */
const MEDICO: any = {
  tipoProntuario: 'MEDICO',
  consultaId: 677,
  codigoProntuario: '345',
  dataHora: '2026-10-02T09:30:00',
  duracaoMinutos: 45,
  tempoDuracao: '35:02',
  status: 'PAGO',
  valor: 250,
  profissionalNome: 'Dra. Bruna Costa Machado',
  profissionalCrm: 'CRM-SP 135836',
  profissionalEspecialidade: 'Ginecologia',
  pressao: '116/79', pulso: '95', temperatura: '36.3', peso: '90.1', altura: '1.58', saturacao: '96',
  hemoglobina: '15.1', frequenciaRespiratoria: '12', frequenciaArterialSistolica: '116', frequenciaArterialDiastolica: '79',
  queixaPrincipal: 'Consulta de rotina e preventivo.',
  anamnese: 'Ciclos regulares, uso de anticoncepcional oral.',
  diagnostico: 'Exame ginecológico sem alterações.',
  cidTexto: 'Z01.4 - Exame ginecológico (geral) (de rotina)',
  tituloPrescricao: 'Suplementação',
  prescricao: 'Ácido fólico 5 mg - 1 comprimido ao dia.',
  orientacoes: 'Manter acompanhamento anual.',
  solicitacaoExameTexto: 'Colpocitologia oncótica; Mamografia.',
  tussTexto: '10101012 - Consulta em consultório',
  observacao: 'Paciente orientado(a) e de acordo com a conduta.',
  dataFinalizado: '2026-10-02',
  planejamentos: [
    { dataProcedimento: '2026-10-02', procedimentoRealizado: 'Coleta de colpocitologia oncótica', valor: 90, statusAssinatura: 'ASSINADO' },
  ],
};

const DENTISTA: any = {
  tipoProntuario: 'DENTISTA',
  consultaId: 900,
  dataHora: '2026-10-10T14:00:00',
  profissionalNome: 'Carlos Lima',
  profissionalCrm: 'CRO-SP 1234',
  facies: 'Simétrica', atm: 'Sem estalidos', gengiva: 'Sangramento leve', higieneBucal: 'Regular',
  planoTratamento: 'Restauração do 16 e profilaxia.',
  inicioTratamento: '2026-10-10',
  dentes: [{ codigo: 1, numeroFdi: 16, status: 'cariado', observacao: 'oclusal' }],
  planejamentos: [
    { dataProcedimento: '2026-10-10', procedimentoRealizado: 'Profilaxia', valor: 150, statusAssinatura: 'ASSINADO' },
    { dataProcedimento: '2026-10-17', procedimentoRealizado: 'Restauração', valor: 250, statusAssinatura: 'PENDENTE' },
  ],
};

describe('HistoricoRegistroCardComponent', () => {
  let fixture: ComponentFixture<HistoricoRegistroCardComponent>;

  /** Células das linhas do corpo da tabela de planejamento, já sem espaços extras. */
  function linhasDaTabela(): string[][] {
    const linhas = (fixture.nativeElement as HTMLElement).querySelectorAll('.hr-tabela tbody tr');
    return Array.from(linhas).map(tr =>
      Array.from(tr.querySelectorAll('td')).map(td => (td.textContent ?? '').replace(/\s+/g, ' ').trim()));
  }

  async function renderizar(registro: any): Promise<string> {
    await TestBed.configureTestingModule({
      declarations: [HistoricoRegistroCardComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();
    fixture = TestBed.createComponent(HistoricoRegistroCardComponent);
    fixture.componentRef.setInput('registro', registro);
    fixture.detectChanges();
    return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
  }

  it('médico: mostra os mesmos campos do Histórico Completo', async () => {
    const t = await renderizar(MEDICO);

    expect(t).toContain('Consulta #677 — 02/10/2026 às 09:30');
    expect(t).toContain('35:02 · 45 min agendados');
    expect(t).toContain('Dra. Bruna Costa Machado — CRM CRM-SP 135836 · Ginecologia');
    expect(t).not.toContain('Dr(a). Dra.');
    expect(t).toContain('Prontuário nº 345');
    for (const trecho of [
      'PA: 116/79', 'Pulso: 95 bpm', 'Temp.: 36.3 °C', 'Peso: 90.1 kg', 'Altura: 1.58 m', 'SpO₂: 96%',
      'Hb: 15.1 g/dL', 'Fr. Resp.: 12 irpm', 'PA Sist.: 116', 'PA Diast.: 79',
      'Anamnese: Ciclos regulares', 'CID: Z01.4',
      'Prescrição — Suplementação: Ácido fólico', 'Orientações ao paciente: Manter acompanhamento anual.',
      'Solicitação de exames: Colpocitologia', 'TUSS: 10101012', 'Observações: Paciente orientado(a)',
      'Finalizado em 02/10/2026',
    ]) {
      expect(t).withContext(trecho).toContain(trecho);
    }
    expect(linhasDaTabela()).toEqual([['02/10/2026', 'Coleta de colpocitologia oncótica', 'R$ 90.00', 'ASSINADO']]);
    expect(t).not.toContain('2026-10-02');
    // Sem blocos exclusivos de dentista no registro médico
    expect(t).not.toContain('Exame intraoral');
    expect(t).not.toContain('Odontograma');
  });

  it('dentista: mostra exame extra/intraoral, tratamento, odontograma e total do planejamento', async () => {
    const t = await renderizar(DENTISTA);

    expect(t).toContain('Dr(a). Carlos Lima — CRO CRO-SP 1234');
    expect(t).toContain('Fácies: Simétrica');
    expect(t).toContain('ATM: Sem estalidos');
    expect(t).toContain('Gengiva: Sangramento leve');
    expect(t).toContain('Higiene bucal: Regular');
    expect(t).toContain('Plano de tratamento: Restauração do 16 e profilaxia.');
    expect(t).toContain('Início: 10/10/2026');
    expect(t).toContain('16 Cariado — oclusal');
    expect(linhasDaTabela()).toEqual([
      ['10/10/2026', 'Profilaxia', 'R$ 150.00', 'ASSINADO'],
      ['17/10/2026', 'Restauração', 'R$ 250.00', 'PENDENTE'],
    ]);
    const rodape = (fixture.nativeElement as HTMLElement).querySelector('tfoot')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(rodape).toBe('TotalR$ 400.00'); // duas células: "Total" e o valor
  });

  it('esconde grupos sem nenhum campo preenchido', async () => {
    const t = await renderizar({ tipoProntuario: 'MEDICO', consultaId: 1, dataHora: '2026-10-02T09:30:00' });

    expect(t).not.toContain('Sinais vitais');
    expect(t).not.toContain('Avaliação');
    expect(t).not.toContain('Planejamento terapêutico');
    expect(t).toContain('—'); // duração ausente
  });
});

describe('HistoricoRegistroCardComponent - botão "Editar prontuário"', () => {
  let fixture: ComponentFixture<HistoricoRegistroCardComponent>;

  /** Monta o card com `usuarioLogadoId` como id do usuário logado (null = sem sessão). */
  async function montar(registro: any, usuarioLogadoId: number | null) {
    await TestBed.configureTestingModule({
      declarations: [HistoricoRegistroCardComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [{
        provide: AuthService,
        useValue: { getCurrentUser: () => (usuarioLogadoId === null ? null : { id: usuarioLogadoId }) },
      }],
    }).compileComponents();
    fixture = TestBed.createComponent(HistoricoRegistroCardComponent);
    fixture.componentRef.setInput('registro', registro);
    fixture.detectChanges();
  }

  const botao = () => (fixture.nativeElement as HTMLElement).querySelector('button.hr-badge--acao') as HTMLButtonElement | null;

  it('dono do registro médico vê o botão, e o clique emite o registro', async () => {
    const registro = { ...MEDICO, profissionalUsuarioId: 8 };
    await montar(registro, 8);
    const emitidos: any[] = [];
    fixture.componentInstance.editar.subscribe(r => emitidos.push(r));
    expect(botao()?.textContent).toContain('Editar prontuário');
    botao()!.click();
    expect(emitidos).toEqual([registro]);
  });

  it('dono do registro odontológico (com prontuário gravado) vê o botão', async () => {
    await montar({ ...DENTISTA, codigoProntuario: '12', profissionalUsuarioId: 8 }, 8);
    expect(botao()).not.toBeNull();
  });

  it('não aparece para quem não é o dono (outro profissional, gestor, secretária)', async () => {
    await montar({ ...MEDICO, profissionalUsuarioId: 8 }, 9);
    expect(botao()).toBeNull();
  });

  it('não aparece quando o item não traz profissionalUsuarioId', async () => {
    await montar(MEDICO, 8);
    expect(botao()).toBeNull();
  });

  it('não aparece sem usuário logado', async () => {
    await montar({ ...MEDICO, profissionalUsuarioId: 8 }, null);
    expect(botao()).toBeNull();
  });

  it('não aparece em registro sem prontuário gravado', async () => {
    await montar({ ...MEDICO, codigoProntuario: undefined, profissionalUsuarioId: 8 }, 8);
    expect(botao()).toBeNull();
  });
});
