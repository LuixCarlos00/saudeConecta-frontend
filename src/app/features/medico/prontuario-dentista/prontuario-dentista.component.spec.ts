import { ComponentFixture, discardPeriodicTasks, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';
import { ProntuarioDentistaComponent } from './prontuario-dentista.component';
import { AbaIdentificacaoComponent } from './aba-identificacao/aba-identificacao.component';
import { AbaExameObjetivoComponent } from './aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaPlanejamentoComponent } from './aba-planejamento/aba-planejamento.component';
import { AbaCodigosTussCidComponent } from './aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';

describe('ProntuarioDentistaComponent: rascunho do atendimento', () => {
  let fixture: ComponentFixture<ProntuarioDentistaComponent>;
  let component: ProntuarioDentistaComponent;
  let rascunhoApi: jasmine.SpyObj<RascunhoAtendimentoApiService>;
  let prontuarioApi: jasmine.SpyObj<ProntuarioDentistaApiService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  const consulta = {
    id: 822, pacienteId: 3, pacienteNome: 'Ana', profissionalId: 9, observacoes: 'Obs da consulta',
  };

  const rascunho: RascunhoAtendimentoResponse = {
    consultaId: 822, tipo: 'DENTISTA', versao: 4, atualizadoEm: '2026-11-05T14:32:10', tempoAcumuladoSegundos: 754,
    dados: {
      identificacao: { responsavel: 'Mae da Ana' },
      exame: { queixaPrincipal: 'Dor', observacao: 'Digitado pelo dentista', pressaoArterial: '12/8', odontograma: [{ numeroFdi: 16, status: 'cariado', observacao: 'oclusal' }] },
      planejamento: {
        planejamentos: [{ id: 1, dataProcedimento: '2026-11-05', procedimentoRealizado: 'Retorno', valor: 90, statusAssinatura: 'ASSINADO', _local: false }],
      },
      codigos: {
        prescricao: 'Dipirona', tussTexto: '1. [10101012] Consulta', cidTexto: '', solicitacaoExameTexto: '',
        tussSelecionados: [{ codigo: '10101012', descricao: 'Consulta' }], tituloPrescricao: 'Prescrição Odontológica',
      },
    },
  };

  function montar(): void {
    TestBed.configureTestingModule({
      declarations: [
        ProntuarioDentistaComponent, AbaIdentificacaoComponent, AbaExameObjetivoComponent,
        AbaPlanejamentoComponent, AbaCodigosTussCidComponent,
      ],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: RascunhoAtendimentoApiService, useValue: rascunhoApi },
        { provide: ProntuarioDentistaApiService, useValue: prontuarioApi },
        { provide: ErrorHandlerService, useValue: errorHandler },
      ],
    });
    TestBed.inject(ProntuarioStateService).setConsulta(consulta);
    fixture = TestBed.createComponent(ProntuarioDentistaComponent);
    component = fixture.componentInstance;
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  }

  beforeEach(() => {
    rascunhoApi = jasmine.createSpyObj('RascunhoAtendimentoApiService', ['buscar', 'salvar', 'descartar', 'listarMeus']);
    prontuarioApi = jasmine.createSpyObj('ProntuarioDentistaApiService', ['cadastrarProntuarioByOrg']);
        errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['showError', 'showSuccessToast']);
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
  });

  describe('com rascunho existente', () => {
    beforeEach(() => {
      rascunhoApi.buscar.and.returnValue(of(rascunho));
      rascunhoApi.salvar.and.callFake(() => of({ ...rascunho, versao: 5 }));
      montar();
    });

    it('aplica o rascunho nas abas, restaura o cronometro e avisa "Atendimento retomado"', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      expect(rascunhoApi.buscar).toHaveBeenCalledWith(822);
      expect(component.abaIdentificacao.responsavel).toBe('Mae da Ana');
      expect(component.abaExameObjetivo.QueixaPrincipal).toBe('Dor');
      expect(component.abaPlanejamento.planejamentos[0].statusAssinatura).toBe('ASSINADO');
      expect(component.abaCodigosTussCid.Prescricao).toBe('Dipirona');
      expect(component.abaCodigosTussCid.tussSelecionados.length).toBe(1);
      expect(component.timer).toBe(754);
      expect(component.minutes).toBe(12);
      expect(component.seconds).toBe(34);
      expect(errorHandler.showSuccessToast).toHaveBeenCalledWith('Atendimento retomado');
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('observacoes da consulta nao sobrescrevem o que veio do rascunho', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);
      expect(component.abaExameObjetivo.observacao).toBe('Digitado pelo dentista');
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('o primeiro PUT leva a versao do rascunho carregado e o cronometro', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.Diagnostico = 'Carie';
      tick(2000 + 5000);
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      const [id, corpo] = rascunhoApi.salvar.calls.mostRecent().args;
      expect(id).toBe(822);
      expect(corpo.versao).toBe(4);
      expect(corpo.tipo).toBe('DENTISTA');
      expect(corpo.dados.exame.diagnostico).toBe('Carie');
      expect(corpo.tempoAcumuladoSegundos).toBeGreaterThanOrEqual(754);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('trocar de aba grava na hora', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.Diagnostico = 'X';
      component.selectedTabIndex = 3;
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('sair da tela dispara o ultimo PUT', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.QueixaPrincipal = 'Mudou agora';
      fixture.destroy();
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      discardPeriodicTasks();
    }));

    it('finalizar para o autosave antes de enviar e usa o tempo acumulado', fakeAsync(() => {
      prontuarioApi.cadastrarProntuarioByOrg.and.callFake(() => of({}));
      fixture.detectChanges();
      tick(0);
      (component as any).concluido();
      flushMicrotasks();
      expect(prontuarioApi.cadastrarProntuarioByOrg).toHaveBeenCalled();
      const payload = prontuarioApi.cadastrarProntuarioByOrg.calls.mostRecent().args[0] as any;
      expect(payload.tempoDuracao).toBe('12:34');
      component.abaExameObjetivo.Diagnostico = 'depois de finalizar';
      tick(2000 + 5000);
      fixture.destroy();
      expect(rascunhoApi.salvar).not.toHaveBeenCalled();
      tick(1500);
      discardPeriodicTasks();
    }));

    it('se finalizar falhar, o autosave volta a funcionar', fakeAsync(() => {
      prontuarioApi.cadastrarProntuarioByOrg.and.returnValue(throwError(() => ({ status: 500 })));
      spyOn(console, 'error');
      fixture.detectChanges();
      tick(0);
      (component as any).concluido();
      flushMicrotasks();
      component.abaExameObjetivo.Diagnostico = 'continuei';
      tick(2000 + 5000);
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('descartar: confirma, faz o DELETE e limpa as abas', fakeAsync(() => {
      rascunhoApi.descartar.and.returnValue(of(undefined));
      fixture.detectChanges();
      tick(0);
      component.descartarRascunho();
      flushMicrotasks();
      expect(rascunhoApi.descartar).toHaveBeenCalledWith(822);
      expect(component.abaIdentificacao.responsavel).toBe('');
      expect(component.abaExameObjetivo.QueixaPrincipal).toBe('');
      expect(component.abaPlanejamento.planejamentos).toEqual([]);
      expect(component.abaCodigosTussCid.tussSelecionados).toEqual([]);
      expect(component.timer).toBe(0);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('descartar cancelado nao chama a API', fakeAsync(() => {
      (Swal.fire as jasmine.Spy).and.resolveTo({ isConfirmed: false });
      fixture.detectChanges();
      tick(0);
      component.descartarRascunho();
      flushMicrotasks();
      expect(rascunhoApi.descartar).not.toHaveBeenCalled();
      expect(component.abaIdentificacao.responsavel).toBe('Mae da Ana');
      fixture.destroy();
      discardPeriodicTasks();
    }));
  });

  describe('sem rascunho', () => {
    beforeEach(() => {
      rascunhoApi.buscar.and.returnValue(of(null));
      rascunhoApi.salvar.and.callFake(() => of({ ...rascunho, versao: 1 }));
      montar();
    });

    it('mantem as abas vazias, preenche as observacoes da consulta e nao mostra aviso', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      expect(component.abaExameObjetivo.observacao).toBe('Obs da consulta');
      expect(component.abaIdentificacao.responsavel).toBe('');
      expect(component.timer).toBeGreaterThanOrEqual(0);
      expect(errorHandler.showSuccessToast).not.toHaveBeenCalled();
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('entrar e sair sem digitar nao cria rascunho (nenhum PUT)', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      tick(10000);
      fixture.destroy();
      expect(rascunhoApi.salvar).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('a primeira gravacao vai com versao null', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.QueixaPrincipal = 'Dor';
      tick(2000 + 5000);
      expect(rascunhoApi.salvar.calls.mostRecent().args[1].versao).toBeNull();
      expect(component.autosave.mensagem).toMatch(/Rascunho salvo/);
      fixture.destroy();
      discardPeriodicTasks();
    }));
  });

  it('erro ao carregar o rascunho avisa e deixa atender normalmente', fakeAsync(() => {
    rascunhoApi.buscar.and.returnValue(throwError(() => ({ status: 500 })));
    montar();
    fixture.detectChanges();
    tick(0);
    expect(errorHandler.showError).toHaveBeenCalled();
    expect(component.abaExameObjetivo.observacao).toBe('Obs da consulta');
    fixture.destroy();
    discardPeriodicTasks();
  }));
});
