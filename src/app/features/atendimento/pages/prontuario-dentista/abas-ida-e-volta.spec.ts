import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { AbaIdentificacaoComponent } from './aba-identificacao/aba-identificacao.component';
import { AbaExameObjetivoComponent } from './aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaPlanejamentoComponent } from './aba-planejamento/aba-planejamento.component';
import { AbaCodigosTussCidComponent } from './aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';

/** Garante que setDados(getDados()) reproduz o mesmo estado em cada aba do dentista (base do rascunho). */
describe('Abas do prontuario dentista: ida e volta do rascunho', () => {

  function criar<T>(tipo: new (...args: any[]) => T): ComponentFixture<T> {
    TestBed.configureTestingModule({
      declarations: [tipo],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
    });
    return TestBed.createComponent(tipo);
  }

  it('identificacao', () => {
    const origem = criar(AbaIdentificacaoComponent).componentInstance;
    origem.responsavel = 'Joao';
    const destino = TestBed.createComponent(AbaIdentificacaoComponent).componentInstance;
    destino.setDados(origem.getDados());
    expect(destino.getDados()).toEqual({ responsavel: 'Joao' });
  });

  it('exame objetivo: campos e odontograma', () => {
    const fixture = criar(AbaExameObjetivoComponent);
    const origem = fixture.componentInstance;
    fixture.detectChanges();
    Object.assign(origem, {
      pressaoArterial: '120/80', pulso: '70', altura: '1,70', temperatura: '36', peso: '70',
      edema: 'leve', facies: 'atipica', linfonodos: 'nao palpaveis',
      QueixaPrincipal: 'Dor', HistoricoOdontologico: 'Ha 2 dias', observacao: 'Obs',
      HigieneBucal: 'boa', CondicaoGengival: 'sangramento', labios: 'ok', mucosas: 'ok',
      soalhoBucal: 'ok', palato: 'ok', orofaringe: 'ok', lingua: 'ok', gengiva: 'ok',
      habitosNocivos: 'nenhum', portadorAparelho: 'nao', oclusal: 'normal', exameOutros: 'x',
      ATM: 'sem estalos', Diagnostico: 'Carie', Orientacoes: 'Escovar',
    });
    origem.getDente(16).status = 'cariado';
    origem.getDente(16).observacao = 'oclusal';
    origem.getDente(21).status = 'ausente';

    const dados = origem.getDados();
    const outro = criar2(AbaExameObjetivoComponent);
    outro.setDados(dados);
    expect(outro.getDados()).toEqual(dados);
    expect(outro.getDente(16).status).toBe('cariado');
    expect(outro.getDente(16).observacao).toBe('oclusal');
    expect(outro.dentesAlterados).toBe(2);
  });

  it('exame objetivo: setDados reseta dentes que nao estao no rascunho', () => {
    const fixture = criar(AbaExameObjetivoComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.getDente(11).status = 'cariado';
    c.setDados({ odontograma: [{ numeroFdi: 12, status: 'ausente' }] });
    expect(c.getDente(11).status).toBe('sadio');
    expect(c.getDente(12).status).toBe('ausente');
  });

  it('exame objetivo: setDados antes do OnInit nao perde o odontograma', () => {
    const fixture = criar(AbaExameObjetivoComponent);
    fixture.componentInstance.setDados({ odontograma: [{ numeroFdi: 12, status: 'ausente' }] });
    fixture.detectChanges();
    expect(fixture.componentInstance.getDente(12).status).toBe('ausente');
  });

  it('exame objetivo: formato do prontuario salvo (`dentes`) continua valendo na edicao', () => {
    const fixture = criar(AbaExameObjetivoComponent);
    fixture.detectChanges();
    fixture.componentInstance.setDados({ dentes: [{ numeroFdi: 18, status: 'cariado' }] });
    expect(fixture.componentInstance.getDente(18).status).toBe('cariado');
  });

  it('planejamento: itens, valores e status de assinatura (getDadosRascunho)', () => {
    const origem = criar(AbaPlanejamentoComponent).componentInstance;
    origem.pacienteId = 7;
    origem.planejamentos = [
      { id: 10, dataProcedimento: '2026-11-01', procedimentoRealizado: 'Limpeza', valor: 150, statusAssinatura: 'ASSINADO', _local: false },
      { dataProcedimento: '2026-11-05', procedimentoRealizado: 'Canal', valor: 800, statusAssinatura: 'PENDENTE', _local: true },
    ];
    const rascunho = origem.getDadosRascunho();
    const destino = TestBed.createComponent(AbaPlanejamentoComponent).componentInstance;
    destino.pacienteId = 7;
    destino.setDados(rascunho);
    expect(destino.getDadosRascunho()).toEqual(rascunho);
    expect(destino.getDados()).toEqual(origem.getDados());
    expect(destino.planejamentos[0].statusAssinatura).toBe('ASSINADO');
    expect(destino.totalPlanejamento).toBe(950);
  });

  it('codigos TUSS/CID: getDados -> setDados restaura textos e listas', () => {
    const origem = criar(AbaCodigosTussCidComponent).componentInstance;
    origem.Prescricao = 'Amoxicilina';
    origem.adicionarTuss({ codigo: '1', descricao: 'Restauracao', fabricante: 'F' });
    origem.adicionarCid({ codigo: 'K02', label: 'Carie' });
    origem.adicionarTussExame({ codigo: '2', descricao: 'Radiografia' });
    origem.adicionarCidExame({ codigo: 'K04', label: 'Pulpite' });
    const dados = origem.getDados();
    const destino = TestBed.createComponent(AbaCodigosTussCidComponent).componentInstance;
    destino.setDados(dados);
    expect(destino.getDados()).toEqual(dados);
    destino.removerCid(0);
    expect(destino.textoCid).toBe('');
  });

  /** Segunda instancia do mesmo componente no mesmo TestBed ja configurado. */
  function criar2<T>(tipo: new (...args: any[]) => T): T {
    const f = TestBed.createComponent(tipo);
    f.detectChanges();
    return f.componentInstance;
  }
});
