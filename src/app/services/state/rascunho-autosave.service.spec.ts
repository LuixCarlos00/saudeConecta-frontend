import { fakeAsync, flushMicrotasks, TestBed, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';
import {
  DEBOUNCE_MS, INTERVALO_TEMPO_MS, INTERVALO_VERIFICACAO_MS, RascunhoAutosaveService, TIMEOUT_AGUARDAR_MS,
} from './rascunho-autosave.service';

describe('RascunhoAutosaveService', () => {
  let service: RascunhoAutosaveService;
  let api: jasmine.SpyObj<RascunhoAtendimentoApiService>;
  let texto: string;
  let tempo: number;
  let aplicar: jasmine.Spy;

  const resposta = (versao: number): RascunhoAtendimentoResponse => ({
    consultaId: 5, tipo: 'MEDICO', versao, atualizadoEm: '2026-11-05T10:00:00', tempoAcumuladoSegundos: tempo,
    dados: { identificacao: {}, exame: { queixa: texto }, planejamento: {}, codigos: {} },
  });

  function iniciar(versao: number | null = null): void {
    service.iniciar({
      consultaId: 5,
      tipo: 'MEDICO',
      coletar: () => ({ identificacao: {}, exame: { queixa: texto }, planejamento: {}, codigos: {} }),
      tempoSegundos: () => tempo,
      aplicar,
    }, versao);
  }

  /** Digita, deixa a verificação periódica perceber e espera o debounce vencer. */
  function digitarEEsperar(novo: string): void {
    texto = novo;
    tick(INTERVALO_VERIFICACAO_MS);
    tick(DEBOUNCE_MS);
  }

  beforeEach(() => {
    texto = '';
    tempo = 0;
    aplicar = jasmine.createSpy('aplicar');
    api = jasmine.createSpyObj('RascunhoAtendimentoApiService', ['salvar', 'buscar']);
    TestBed.configureTestingModule({
      providers: [RascunhoAutosaveService, { provide: RascunhoAtendimentoApiService, useValue: api }],
    });
    service = TestBed.inject(RascunhoAutosaveService);
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
  });

  it('nao grava nada se nada mudou (entrar e sair sem digitar nao cria rascunho)', fakeAsync(() => {
    iniciar();
    tick(INTERVALO_VERIFICACAO_MS * 5);
    service.salvarAgora();
    expect(api.salvar).not.toHaveBeenCalled();
    service.parar();
  }));

  it('grava ~5 s depois da ultima alteracao, com versao null na primeira vez', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    texto = 'dor';
    tick(INTERVALO_VERIFICACAO_MS);          // detecta
    tick(DEBOUNCE_MS - 1);
    expect(api.salvar).not.toHaveBeenCalled();
    tick(1);
    expect(api.salvar).toHaveBeenCalledTimes(1);
    const [consultaId, corpo] = api.salvar.calls.mostRecent().args;
    expect(consultaId).toBe(5);
    expect(corpo.versao).toBeNull();
    expect(corpo.tipo).toBe('MEDICO');
    expect(corpo.dados.exame).toEqual({ queixa: 'dor' });
    expect(service.estado).toBe('salvo');
    expect(service.mensagem).toMatch(/^Rascunho salvo às \d{2}:\d{2}$/);
    service.parar();
  }));

  it('debounce: digitar de novo antes dos 5 s adia a gravacao', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    texto = 'a';
    tick(INTERVALO_VERIFICACAO_MS);
    tick(DEBOUNCE_MS - INTERVALO_VERIFICACAO_MS);   // falta pouco
    texto = 'ab';
    tick(INTERVALO_VERIFICACAO_MS);                 // t=7s: a verificacao de t=6s viu a alteracao e rearmou (fire em t=11s)
    tick(4000 - 1);                                 // ainda antes de t=11s
    expect(api.salvar).not.toHaveBeenCalled();
    tick(1);
    expect(api.salvar).toHaveBeenCalledTimes(1);
    expect(api.salvar.calls.mostRecent().args[1].dados.exame).toEqual({ queixa: 'ab' });
    service.parar();
  }));

  it('guarda a versao devolvida e manda no PUT seguinte', fakeAsync(() => {
    api.salvar.and.returnValues(of(resposta(1)), of(resposta(2)));
    iniciar();
    digitarEEsperar('um');
    digitarEEsperar('dois');
    expect(api.salvar.calls.argsFor(0)[1].versao).toBeNull();
    expect(api.salvar.calls.argsFor(1)[1].versao).toBe(1);
    expect(service.temRascunho).toBeTrue();
    service.parar();
  }));

  it('usa a versao do rascunho carregado no primeiro PUT', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(8)));
    iniciar(7);
    digitarEEsperar('x');
    expect(api.salvar.calls.mostRecent().args[1].versao).toBe(7);
    service.parar();
  }));

  it('envia o cronometro acumulado', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    tempo = 754;
    digitarEEsperar('x');
    expect(api.salvar.calls.mostRecent().args[1].tempoAcumuladoSegundos).toBe(754);
    service.parar();
  }));

  it('com rascunho existente, salvarAgora grava so o cronometro mudado (ao sair da tela)', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(4)));
    iniciar(3);
    tempo = 60;
    service.salvarAgora();
    expect(api.salvar).toHaveBeenCalledTimes(1);
    service.parar();
  }));

  it('salvarAgora grava sem esperar o debounce (troca de aba)', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    texto = 'x';
    service.salvarAgora();
    expect(api.salvar).toHaveBeenCalledTimes(1);
    service.parar();
  }));

  it('erro de rede: mostra aviso, nao trava e tenta de novo no proximo ciclo', fakeAsync(() => {
    api.salvar.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 0 })),
      of(resposta(1)),
    );
    iniciar();
    digitarEEsperar('x');
    expect(service.estado).toBe('erro');
    expect(service.mensagem).toBe('Não foi possível salvar o rascunho');
    tick(DEBOUNCE_MS);
    expect(api.salvar).toHaveBeenCalledTimes(2);
    expect(service.estado).toBe('salvo');
    service.parar();
  }));

  it('422/413 nao fica repetindo o mesmo conteudo', fakeAsync(() => {
    api.salvar.and.callFake(() => throwError(() => new HttpErrorResponse({ status: 413 })));
    iniciar();
    digitarEEsperar('x');
    tick(DEBOUNCE_MS * 3);
    expect(api.salvar).toHaveBeenCalledTimes(1);
    expect(service.estado).toBe('erro');
    service.parar();
  }));

  it('409 RASCUNHO_DESATUALIZADO: avisa e "Recarregar" aplica o rascunho do servidor', fakeAsync(() => {
    const doServidor = resposta(9);
    api.salvar.and.callFake(() => throwError(() =>
      new HttpErrorResponse({ status: 409, error: { code: 'RASCUNHO_DESATUALIZADO' } })));
    api.buscar.and.returnValue(of(doServidor));
    iniciar(3);
    digitarEEsperar('x');
    flushMicrotasks();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ confirmButtonText: 'Recarregar' }));
    expect(api.buscar).toHaveBeenCalledWith(5);
    expect(aplicar).toHaveBeenCalledWith(doServidor);
    expect(service.estado).toBe('salvo');

    // depois de recarregar, o PUT seguinte usa a versao nova
    api.salvar.and.callFake(() => of(resposta(10)));
    digitarEEsperar('y');
    expect(api.salvar.calls.mostRecent().args[1].versao).toBe(9);
    service.parar();
  }));

  it('409 RASCUNHO_DESATUALIZADO: nao regrava enquanto o aviso esta aberto', fakeAsync(() => {
    api.salvar.and.callFake(() => throwError(() =>
      new HttpErrorResponse({ status: 409, error: { code: 'RASCUNHO_DESATUALIZADO' } })));
    (Swal.fire as jasmine.Spy).and.returnValue(new Promise(() => { /* nunca resolve: aviso aberto */ }));
    api.buscar.and.returnValue(of(resposta(9)));
    iniciar(3);
    digitarEEsperar('x');
    tick(DEBOUNCE_MS * 3);
    expect(api.salvar).toHaveBeenCalledTimes(1);
    service.parar();
  }));

  it('409 CONSULTA_ENCERRADA: para o autosave e informa', fakeAsync(() => {
    api.salvar.and.callFake(() => throwError(() =>
      new HttpErrorResponse({ status: 409, error: { code: 'CONSULTA_ENCERRADA', message: 'Consulta já encerrada' } })));
    iniciar();
    digitarEEsperar('x');
    expect(service.estado).toBe('encerrado');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'info', text: 'Consulta já encerrada' }));
    texto = 'outra coisa';
    tick(INTERVALO_VERIFICACAO_MS + DEBOUNCE_MS * 2);
    expect(api.salvar).toHaveBeenCalledTimes(1);
  }));

  it('pararEAguardar espera o PUT em andamento terminar e nao deixa gravar de novo', fakeAsync(() => {
    const resposta$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValue(resposta$);
    iniciar();
    digitarEEsperar('x');
    expect(service.estado).toBe('salvando');
    let liberou = false;
    service.pararEAguardar().then(() => liberou = true);
    flushMicrotasks();
    expect(liberou).toBeFalse();
    expect(resposta$.observed).toBeTrue();           // nao cancelou o PUT
    resposta$.next(resposta(1));
    resposta$.complete();
    flushMicrotasks();
    expect(liberou).toBeTrue();
    expect(service.estado).toBe('salvo');
    texto = 'y';
    service.salvarAgora();
    tick(INTERVALO_VERIFICACAO_MS + DEBOUNCE_MS);
    expect(api.salvar).toHaveBeenCalledTimes(1);
  }));

  it('pararEAguardar segue depois do timeout se o PUT nao responde', fakeAsync(() => {
    api.salvar.and.returnValue(new Subject<RascunhoAtendimentoResponse>());
    iniciar();
    digitarEEsperar('x');
    let liberou = false;
    service.pararEAguardar().then(() => liberou = true);
    tick(TIMEOUT_AGUARDAR_MS - 1);
    expect(liberou).toBeFalse();
    tick(1);
    flushMicrotasks();
    expect(liberou).toBeTrue();
  }));

  it('409 causado pela propria aba: servidor igual ao PUT anterior adota a versao em silencio e regrava', fakeAsync(() => {
    const conflito = () => throwError(() =>
      new HttpErrorResponse({ status: 409, error: { code: 'RASCUNHO_DESATUALIZADO' } }));
    const primeira$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValues(primeira$, conflito(), of(resposta(7)));
    iniciar(3);
    texto = 'um';
    service.salvarAgora();                   // PUT A: o back grava, mas a resposta nunca chega
    const gravadoPeloBack = { ...resposta(4), dados: { identificacao: {}, exame: { queixa: 'um' }, planejamento: {}, codigos: {} } };
    primeira$.error(new HttpErrorResponse({ status: 0 }));   // rede caiu: erro local, back tem versao 4
    flushMicrotasks();
    api.buscar.and.returnValue(of(gravadoPeloBack));
    texto = 'um dois';
    tick(INTERVALO_VERIFICACAO_MS);
    tick(DEBOUNCE_MS);                       // PUT B com versao 3 -> 409
    flushMicrotasks();
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(aplicar).not.toHaveBeenCalled();
    expect(api.buscar).toHaveBeenCalledWith(5);
    expect(api.salvar).toHaveBeenCalledTimes(3);
    const terceira = api.salvar.calls.argsFor(2)[1];
    expect(terceira.versao).toBe(4);
    expect(terceira.dados.exame).toEqual({ queixa: 'um dois' });
    expect(service.estado).toBe('salvo');
    service.parar();
  }));

  it('409 com divergencia real: mostra o aviso com Recarregar', fakeAsync(() => {
    const primeira$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValues(primeira$, throwError(() =>
      new HttpErrorResponse({ status: 409, error: { code: 'RASCUNHO_DESATUALIZADO' } })));
    iniciar(3);
    texto = 'um';
    service.salvarAgora();
    primeira$.error(new HttpErrorResponse({ status: 0 }));
    flushMicrotasks();
    // outro computador gravou outra coisa
    api.buscar.and.returnValue(of({ ...resposta(4), dados: { identificacao: {}, exame: { queixa: 'de outro lugar' }, planejamento: {}, codigos: {} } }));
    texto = 'um dois';
    tick(INTERVALO_VERIFICACAO_MS);
    tick(DEBOUNCE_MS);
    flushMicrotasks();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ confirmButtonText: 'Recarregar' }));
    service.parar();
  }));

  it('mesmo dados mas cronometro diferente do servidor conta como divergencia', fakeAsync(() => {
    const primeira$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValues(primeira$, throwError(() =>
      new HttpErrorResponse({ status: 409, error: { code: 'RASCUNHO_DESATUALIZADO' } })));
    iniciar(3);
    texto = 'um';
    service.salvarAgora();
    primeira$.error(new HttpErrorResponse({ status: 0 }));
    flushMicrotasks();
    api.buscar.and.returnValue(of({ ...resposta(4), tempoAcumuladoSegundos: 999 }));
    texto = 'um dois';
    tick(INTERVALO_VERIFICACAO_MS);
    tick(DEBOUNCE_MS);
    flushMicrotasks();
    expect(Swal.fire).toHaveBeenCalled();
    service.parar();
  }));

  it('413 mostra a mensagem do back e nao repete o mesmo conteudo', fakeAsync(() => {
    api.salvar.and.callFake(() => throwError(() => new HttpErrorResponse({
      status: 413, error: { code: 'RASCUNHO_MUITO_GRANDE', message: 'Rascunho acima de 2,5 MB' },
    })));
    iniciar();
    digitarEEsperar('x');
    tick(DEBOUNCE_MS * 3);
    expect(api.salvar).toHaveBeenCalledTimes(1);
    expect(service.detalheErro).toBe('Rascunho acima de 2,5 MB');
    service.parar();
  }));

  it('temAlteracaoNaoSalva: true com mudanca nas abas ou PUT em andamento, false depois de salvar', fakeAsync(() => {
    const resposta$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValue(resposta$);
    iniciar();
    expect(service.temAlteracaoNaoSalva).toBeFalse();
    texto = 'x';
    expect(service.temAlteracaoNaoSalva).toBeTrue();
    service.salvarAgora();
    expect(service.temAlteracaoNaoSalva).toBeTrue();   // PUT em andamento
    resposta$.next(resposta(1));
    resposta$.complete();
    expect(service.temAlteracaoNaoSalva).toBeFalse();
    tempo = 500;                                        // so o cronometro: nao avisa na saida
    expect(service.temAlteracaoNaoSalva).toBeFalse();
    service.parar();
  }));

  it('sairDaTela com PUT em andamento: a ultima edicao sai quando o PUT termina, mesmo parado', fakeAsync(() => {
    const primeira$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValues(primeira$, of(resposta(2)));
    iniciar();
    texto = 'a';
    service.salvarAgora();
    texto = 'ab';
    service.sairDaTela();                     // PUT em voo: marca pendente
    expect(api.salvar).toHaveBeenCalledTimes(1);
    primeira$.next(resposta(1));
    primeira$.complete();
    expect(api.salvar).toHaveBeenCalledTimes(2);
    expect(api.salvar.calls.argsFor(1)[1].dados.exame).toEqual({ queixa: 'ab' });
    expect(api.salvar.calls.argsFor(1)[1].versao).toBe(1);
  }));

  it('sairDaTela sem PUT em andamento grava a alteracao pendente', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    texto = 'x';
    service.sairDaTela();
    expect(api.salvar).toHaveBeenCalledTimes(1);
  }));

  it('sairDaTela com o autosave ja parado (finalizado) nao grava', fakeAsync(() => {
    iniciar();
    service.parar();
    texto = 'x';
    service.sairDaTela();
    expect(api.salvar).not.toHaveBeenCalled();
  }));

  it('cronometro: so o tempo mudou, grava a cada 60 s (com rascunho existente)', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(4)));
    iniciar(3);
    tempo = 30;
    tick(INTERVALO_TEMPO_MS - INTERVALO_VERIFICACAO_MS);
    expect(api.salvar).not.toHaveBeenCalled();
    tick(INTERVALO_VERIFICACAO_MS);
    expect(api.salvar).toHaveBeenCalledTimes(1);
    expect(api.salvar.calls.mostRecent().args[1].tempoAcumuladoSegundos).toBe(30);
    expect(api.salvar.calls.mostRecent().args[1].versao).toBe(3);
    service.parar();
  }));

  it('cronometro: sem rascunho e sem digitacao nao cria rascunho so por causa do tempo', fakeAsync(() => {
    iniciar();
    tempo = 500;
    tick(INTERVALO_TEMPO_MS * 3);
    expect(api.salvar).not.toHaveBeenCalled();
    service.parar();
  }));

  it('retomar volta a gravar depois de um parar (finalizar falhou)', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    service.parar();
    service.retomar();
    digitarEEsperar('x');
    expect(api.salvar).toHaveBeenCalledTimes(1);
    service.parar();
  }));

  it('durante um PUT em andamento, uma segunda gravacao espera e sai em seguida', fakeAsync(() => {
    const primeira$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValues(primeira$, of(resposta(2)));
    iniciar();
    texto = 'a';
    service.salvarAgora();
    texto = 'ab';
    service.salvarAgora();                    // fica pendente
    expect(api.salvar).toHaveBeenCalledTimes(1);
    primeira$.next(resposta(1));
    primeira$.complete();
    expect(api.salvar).toHaveBeenCalledTimes(2);
    expect(api.salvar.calls.argsFor(1)[1].versao).toBe(1);
    service.parar();
    discardPeriodicTasks();
  }));
});
