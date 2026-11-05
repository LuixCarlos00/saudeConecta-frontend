import { ComponentFixture, discardPeriodicTasks, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { EdicaoProntuarioService } from '../edicao-prontuario.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';
import { ProntuarioMedicoComponent } from './prontuario-medico.component';
import { AbaIdentificacaoMedicoComponent } from './aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaExameObjetivoMedicoComponent } from './aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaPlanejamentoMedicoComponent } from './aba-planejamento-medico/aba-planejamento-medico.component';
import { AbaCodigosTussCidMedicoComponent } from './aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';

describe('ProntuarioMedicoComponent: rascunho do atendimento', () => {
  let fixture: ComponentFixture<ProntuarioMedicoComponent>;
  let component: ProntuarioMedicoComponent;
  let rascunhoApi: jasmine.SpyObj<RascunhoAtendimentoApiService>;
  let prontuarioApi: jasmine.SpyObj<ProntuarioApiService>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;

  const consulta = {
    id: 822, pacienteId: 3, pacienteNome: 'Ana', profissionalId: 9, observacoes: 'Obs da consulta',
  };

  const rascunho: RascunhoAtendimentoResponse = {
    consultaId: 822, tipo: 'MEDICO', versao: 4, atualizadoEm: '2026-11-05T14:32:10', tempoAcumuladoSegundos: 754,
    dados: {
      identificacao: { responsavel: 'Mae da Ana' },
      exame: { queixaPrincipal: 'Dor', observacao: 'Digitado pelo medico', pressao: '12/8' },
      planejamento: {
        planejamentos: [{ id: 1, dataProcedimento: '2026-11-05', procedimentoRealizado: 'Retorno', valor: 90, statusAssinatura: 'ASSINADO', _local: false }],
      },
      codigos: {
        prescricao: 'Dipirona', tussTexto: '1. [10101012] Consulta', cidTexto: '', solicitacaoExameTexto: '',
        tussSelecionados: [{ codigo: '10101012', descricao: 'Consulta' }],
      },
    },
  };

  function montar(): void {
    TestBed.configureTestingModule({
      declarations: [
        ProntuarioMedicoComponent, AbaIdentificacaoMedicoComponent, AbaExameObjetivoMedicoComponent,
        AbaPlanejamentoMedicoComponent, AbaCodigosTussCidMedicoComponent,
      ],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: RascunhoAtendimentoApiService, useValue: rascunhoApi },
        { provide: ProntuarioApiService, useValue: prontuarioApi },
        { provide: NotificacaoService, useValue: notificacao },
      ],
    });
    TestBed.inject(ProntuarioStateService).setConsulta(consulta);
    fixture = TestBed.createComponent(ProntuarioMedicoComponent);
    component = fixture.componentInstance;
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  }

  beforeEach(() => {
    rascunhoApi = jasmine.createSpyObj('RascunhoAtendimentoApiService', ['buscar', 'salvar', 'descartar', 'listarMeus']);
    prontuarioApi = jasmine.createSpyObj('ProntuarioApiService', ['cadastrarProntuarioMedico', 'buscarProntuarioById']);
    prontuarioApi.buscarProntuarioById.and.returnValue(throwError(() => ({ status: 404 })));
    notificacao = jasmine.createSpyObj('NotificacaoService', ['showError', 'showSuccessToast', 'fire']);
    // fire continua passando pelo Swal.fire, que os testes espiam.
    notificacao.fire.and.callFake((...args: any[]) => (Swal.fire as any)(...args));
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
      expect(component.abaExameObjetivo.queixaPrincipal).toBe('Dor');
      expect(component.abaPlanejamento.planejamentos[0].statusAssinatura).toBe('ASSINADO');
      expect(component.abaCodigosTussCid.Prescricao).toBe('Dipirona');
      expect(component.abaCodigosTussCid.tussSelecionados.length).toBe(1);
      expect(component.timer).toBe(754);
      expect(component.minutes).toBe(12);
      expect(component.seconds).toBe(34);
      expect(notificacao.showSuccessToast).toHaveBeenCalledWith('Atendimento retomado');
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('observacoes da consulta nao sobrescrevem o que veio do rascunho', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);
      expect(component.abaExameObjetivo.observacao).toBe('Digitado pelo medico');
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('o primeiro PUT leva a versao do rascunho carregado e o cronometro', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.diagnostico = 'Enxaqueca';
      tick(2000 + 5000);
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      const [id, corpo] = rascunhoApi.salvar.calls.mostRecent().args;
      expect(id).toBe(822);
      expect(corpo.versao).toBe(4);
      expect(corpo.tipo).toBe('MEDICO');
      expect(corpo.dados.exame.diagnostico).toBe('Enxaqueca');
      expect(corpo.tempoAcumuladoSegundos).toBeGreaterThanOrEqual(754);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('trocar de aba grava na hora', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.diagnostico = 'X';
      component.selectedTabIndex = 3;
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('usa o rascunho pre-carregado pelo guard, sem repetir o GET', fakeAsync(() => {
      TestBed.inject(ProntuarioStateService).setRascunhoPreCarregado(822, rascunho);
      fixture.detectChanges();
      tick(0);
      expect(rascunhoApi.buscar).not.toHaveBeenCalled();
      expect(component.abaExameObjetivo.queixaPrincipal).toBe('Dor');
      expect(component.timer).toBe(754);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('beforeunload com digitacao nao salva pede o aviso nativo; sem alteracao nao pede', fakeAsync(() => {
      rascunhoApi.salvar.and.returnValue(new Subject<RascunhoAtendimentoResponse>());
      fixture.detectChanges();
      tick(0);
      const limpo = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      component.aoFecharJanela(limpo);
      expect(limpo.defaultPrevented).toBeFalse();
      component.abaExameObjetivo.diagnostico = 'Nao salvo ainda';
      const sujo = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      component.aoFecharJanela(sujo);
      expect(sujo.defaultPrevented).toBeTrue();
      expect(sujo.returnValue).toBeFalsy();
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('sair da tela com PUT em andamento ainda grava a ultima edicao', fakeAsync(() => {
      const primeira$ = new Subject<RascunhoAtendimentoResponse>();
      rascunhoApi.salvar.and.returnValues(primeira$, of({ ...rascunho, versao: 6 }));
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.diagnostico = 'primeira';
      component.autosave.salvarAgora();
      component.abaExameObjetivo.diagnostico = 'ultima';
      fixture.destroy();
      primeira$.next({ ...rascunho, versao: 5 });
      primeira$.complete();
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(2);
      expect(rascunhoApi.salvar.calls.mostRecent().args[1].dados.exame.diagnostico).toBe('ultima');
      discardPeriodicTasks();
    }));

    it('sair da tela dispara o ultimo PUT', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      component.abaExameObjetivo.queixaPrincipal = 'Mudou agora';
      fixture.destroy();
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      discardPeriodicTasks();
    }));

    it('finalizar para o autosave antes de enviar e usa o tempo acumulado', fakeAsync(() => {
      prontuarioApi.cadastrarProntuarioMedico.and.callFake(() => of({}));
      fixture.detectChanges();
      tick(0);
      (component as any).concluido();
      flushMicrotasks();
      expect(prontuarioApi.cadastrarProntuarioMedico).toHaveBeenCalled();
      const payload = prontuarioApi.cadastrarProntuarioMedico.calls.mostRecent().args[0] as any;
      expect(payload.tempoDuracao).toBe('12:34');
      component.abaExameObjetivo.diagnostico = 'depois de finalizar';
      tick(2000 + 5000);
      fixture.destroy();
      expect(rascunhoApi.salvar).not.toHaveBeenCalled();
      tick(1500);
      discardPeriodicTasks();
    }));

    it('se finalizar falhar, o autosave volta a funcionar', fakeAsync(() => {
      prontuarioApi.cadastrarProntuarioMedico.and.returnValue(throwError(() => ({ status: 500 })));
      spyOn(console, 'error');
      fixture.detectChanges();
      tick(0);
      (component as any).concluido();
      flushMicrotasks();
      component.abaExameObjetivo.diagnostico = 'continuei';
      tick(2000 + 5000);
      expect(rascunhoApi.salvar).toHaveBeenCalledTimes(1);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    describe('409 PRONTUARIO_JA_FINALIZADO', () => {
      const MSG = 'Esta consulta já foi finalizada. Para corrigir o prontuário, use a edição.';
      let editar: jasmine.Spy;

      beforeEach(() => {
        prontuarioApi.cadastrarProntuarioMedico.and.returnValue(throwError(() => ({
          status: 409, error: { code: 'PRONTUARIO_JA_FINALIZADO', message: MSG },
        })));
        editar = spyOn(TestBed.inject(EdicaoProntuarioService), 'editar').and.returnValue(of(true));
      });

      it('oferece "Editar prontuário"; ao aceitar abre a edição da consulta e depois volta para a agenda, sem religar o autosave', fakeAsync(() => {
        fixture.detectChanges();
        tick(0);
        (component as any).concluido();
        flushMicrotasks();
        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
          title: 'Consulta já finalizada', text: MSG, confirmButtonText: 'Editar prontuário', showCancelButton: true,
        }));
        flushMicrotasks();
        expect(editar).toHaveBeenCalledOnceWith('MEDICO', jasmine.objectContaining({ id: 822, pacienteId: 3, profissionalId: 9 }));
        expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/agenda-calendario']);
        component.abaExameObjetivo.diagnostico = 'digitado depois';
        tick(2000 + 5000);
        expect(rascunhoApi.salvar).not.toHaveBeenCalled();
        fixture.destroy();
        discardPeriodicTasks();
      }));

      it('recusar a edição só volta para a agenda', fakeAsync(() => {
        (Swal.fire as jasmine.Spy).and.resolveTo({ isConfirmed: false } as any);
        fixture.detectChanges();
        tick(0);
        (component as any).concluido();
        flushMicrotasks();
        flushMicrotasks();
        expect(editar).not.toHaveBeenCalled();
        expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/agenda-calendario']);
        fixture.destroy();
        discardPeriodicTasks();
      }));
    });

    it('descartar: confirma, faz o DELETE e limpa as abas', fakeAsync(() => {
      rascunhoApi.descartar.and.returnValue(of(undefined));
      fixture.detectChanges();
      tick(0);
      component.descartarRascunho();
      flushMicrotasks();
      expect(rascunhoApi.descartar).toHaveBeenCalledWith(822);
      expect(component.abaIdentificacao.responsavel).toBe('');
      expect(component.abaExameObjetivo.queixaPrincipal).toBe('');
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
      expect(notificacao.showSuccessToast).not.toHaveBeenCalled();
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
      component.abaExameObjetivo.queixaPrincipal = 'Dor';
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
    expect(notificacao.showError).toHaveBeenCalled();
    expect(component.abaExameObjetivo.observacao).toBe('Obs da consulta');
    fixture.destroy();
    discardPeriodicTasks();
  }));
});
