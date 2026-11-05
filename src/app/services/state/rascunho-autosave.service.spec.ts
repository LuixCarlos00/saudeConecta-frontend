import { fakeAsync, flushMicrotasks, TestBed, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';
import { DEBOUNCE_MS, INTERVALO_VERIFICACAO_MS, RascunhoAutosaveService } from './rascunho-autosave.service';

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

  it('parar(true) cancela o PUT em andamento e impede novas gravacoes (antes de finalizar)', fakeAsync(() => {
    const resposta$ = new Subject<RascunhoAtendimentoResponse>();
    api.salvar.and.returnValue(resposta$);
    iniciar();
    digitarEEsperar('x');
    expect(service.estado).toBe('salvando');
    service.parar(true);
    expect(resposta$.observed).toBeFalse();
    texto = 'y';
    service.salvarAgora();
    tick(INTERVALO_VERIFICACAO_MS + DEBOUNCE_MS);
    expect(api.salvar).toHaveBeenCalledTimes(1);
  }));

  it('retomar volta a gravar depois de um parar (finalizar falhou)', fakeAsync(() => {
    api.salvar.and.callFake(() => of(resposta(1)));
    iniciar();
    service.parar(true);
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
