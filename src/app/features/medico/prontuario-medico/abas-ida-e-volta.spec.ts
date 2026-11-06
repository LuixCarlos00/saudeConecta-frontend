import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';
import { AbaIdentificacaoMedicoComponent } from './aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaExameObjetivoMedicoComponent } from './aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaPlanejamentoMedicoComponent } from './aba-planejamento-medico/aba-planejamento-medico.component';
import { AbaCodigosTussCidMedicoComponent } from './aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';

/** Garante que setDados(getDados()) reproduz o mesmo estado em cada aba do médico (base do rascunho). */
describe('Abas do prontuario medico: ida e volta do rascunho', () => {

  function criar<T>(tipo: new (...args: any[]) => T): ComponentFixture<T> {
    TestBed.configureTestingModule({
      declarations: [tipo],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
    });
    return TestBed.createComponent(tipo);
  }

  it('identificacao', () => {
    const origem = criar(AbaIdentificacaoMedicoComponent).componentInstance;
    origem.responsavel = 'Maria da Silva';
    const destino = TestBed.createComponent(AbaIdentificacaoMedicoComponent).componentInstance;
    destino.setDados(origem.getDados());
    expect(destino.getDados()).toEqual({ responsavel: 'Maria da Silva' });
  });

  it('exame objetivo', () => {
    const origem = criar(AbaExameObjetivoMedicoComponent).componentInstance;
    Object.assign(origem, {
      pressao: '120/80', frequenciaRespiratoria: '16', frequenciaArterialSistolica: '120',
      frequenciaArterialDiastolica: '80', pulso: '70', altura: '1,70', temperatura: '36,5',
      peso: '70', saturacao: '98', hemoglobina: '14', queixaPrincipal: 'Dor de cabeca',
      anamnese: 'Ha 3 dias', observacao: 'Obs', exameOutros: 'Nada', diagnostico: 'Enxaqueca',
      orientacoes: 'Repouso',
    });
    const dados = origem.getDados();
    const destino = TestBed.createComponent(AbaExameObjetivoMedicoComponent).componentInstance;
    destino.setDados(dados);
    expect(destino.getDados()).toEqual(dados);
  });

  it('planejamento: itens, valores e status de assinatura (getDadosRascunho)', () => {
    const origem = criar(AbaPlanejamentoMedicoComponent).componentInstance;
    origem.pacienteId = 7;
    origem.planejamentos = [
      { id: 10, dataProcedimento: '2026-11-01', procedimentoRealizado: 'Retorno', valor: 150, statusAssinatura: 'ASSINADO', _local: false },
      { dataProcedimento: '2026-11-05', procedimentoRealizado: 'Exame', valor: 80.5, statusAssinatura: 'PENDENTE', _local: true },
    ];
    const rascunho = origem.getDadosRascunho();
    const destino = TestBed.createComponent(AbaPlanejamentoMedicoComponent).componentInstance;
    destino.pacienteId = 7;
    destino.setDados(rascunho);
    expect(destino.getDadosRascunho()).toEqual(rascunho);
    expect(destino.planejamentos[0].statusAssinatura).toBe('ASSINADO');
    expect(destino.planejamentos[1]._local).toBeTrue();
    expect(destino.getDados()).toEqual(origem.getDados());
    expect(destino.totalPlanejamento).toBe(230.5);
  });

  it('planejamento: setDados do formato do prontuario salvo continua valendo (edicao)', () => {
    const c = criar(AbaPlanejamentoMedicoComponent).componentInstance;
    c.setDados({ planejamentos: [{ id: 3, valor: 10, procedimentoRealizado: 'X' } as any] });
    expect(c.planejamentos[0]).toEqual(jasmine.objectContaining({ id: 3, statusAssinatura: 'PENDENTE', _local: false }));
  });

  it('codigos TUSS/CID: textos, prescricao e listas selecionadas', () => {
    const origem = criar(AbaCodigosTussCidMedicoComponent).componentInstance;
    origem.Prescricao = 'Dipirona 500mg';
    origem.adicionarTuss({ codigo: '1', descricao: 'Consulta', fabricante: 'F' });
    origem.adicionarCid({ codigo: 'A00', label: 'Colera' });
    origem.adicionarTussExame({ codigo: '2', descricao: 'Hemograma' });
    origem.adicionarCidExame({ codigo: 'B01', label: 'Varicela' });
    const rascunho = origem.getDadosRascunho();
    const destino = TestBed.createComponent(AbaCodigosTussCidMedicoComponent).componentInstance;
    destino.setDados(rascunho);
    expect(destino.getDadosRascunho()).toEqual(rascunho);
    expect(destino.getDados()).toEqual(origem.getDados());
    // remover depois de restaurar regenera o texto a partir da lista restaurada
    destino.removerTuss(0);
    expect(destino.textoTuss).toBe('');
  });

  it('codigos TUSS/CID: setDados sem listas (modo edicao) nao apaga as listas atuais', () => {
    const c = criar(AbaCodigosTussCidMedicoComponent).componentInstance;
    c.adicionarCid({ codigo: 'A00', label: 'Colera' });
    c.setDados({ prescricao: 'x', cidTexto: '1. [A00] Colera' });
    expect(c.cidSelecionados.length).toBe(1);
  });
});
