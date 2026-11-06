import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { delay, of, throwError } from 'rxjs';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { ProntuarioApiService } from 'src/app/core/data-access/prontuario-api.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { AbaCodigosTussCidMedicoComponent } from '../aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';
import { AbaExameObjetivoMedicoComponent } from '../aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaIdentificacaoMedicoComponent } from '../aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaPlanejamentoMedicoComponent } from '../aba-planejamento-medico/aba-planejamento-medico.component';
import { EditarProntuarioMedicoComponent } from './editar-prontuario-medico.component';

describe('EditarProntuarioMedicoComponent', () => {
  let fixture: ComponentFixture<EditarProntuarioMedicoComponent>;
  let component: EditarProntuarioMedicoComponent;
  let api: jasmine.SpyObj<ProntuarioApiService>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EditarProntuarioMedicoComponent>>;

  const consulta = { id: 822, pacienteId: 3, profissionalId: 9, pacienteNome: 'Ana' };
  const prontuario: any = {
    codigoProntuario: 345,
    responsavel: 'Mae da Ana',
    pressao: '12/8', pulso: '80', peso: '70', altura: '1.70', temperatura: '36', saturacao: '97',
    hemoglobina: '13', frequenciaRespiratoria: '16', frequenciaArterialSistolica: '120', frequenciaArterialDiastolica: '80',
    queixaPrincipal: 'Dor', anamnese: 'Ha 3 dias', observacao: 'Obs', diagnostico: 'Gripe', orientacoes: 'Repouso',
    prescricao: 'Dipirona', tussTexto: '1. [10101012] Consulta', cidTexto: '1. [J11] Gripe', solicitacaoExameTexto: '',
    dataFinalizado: '2026-10-02',
    planejamentos: [{ id: 5, dataProcedimento: '2026-10-02', procedimentoRealizado: 'Retorno', valor: 90, statusAssinatura: 'ASSINADO' }],
  };

  function montar(): void {
    api = jasmine.createSpyObj('ProntuarioApiService', ['buscarProntuarioById', 'atualizarProntuarioMedico']);
    // Assíncrono como o HTTP real (resposta síncrona dispara NG0100 em modo dev, só no teste)
    api.buscarProntuarioById.and.returnValue(of(prontuario).pipe(delay(0)));
    notificacao = jasmine.createSpyObj('NotificacaoService', ['showError', 'showSuccessToast', 'fire']);
    notificacao.fire.and.resolveTo({ isConfirmed: true } as any);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      declarations: [
        EditarProntuarioMedicoComponent, AbaIdentificacaoMedicoComponent, AbaExameObjetivoMedicoComponent,
        AbaCodigosTussCidMedicoComponent, AbaPlanejamentoMedicoComponent,
      ],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: ProntuarioApiService, useValue: api },
        { provide: NotificacaoService, useValue: notificacao },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { consulta } },
      ],
    });
    fixture = TestBed.createComponent(EditarProntuarioMedicoComponent);
    component = fixture.componentInstance;
  }

  /** Carrega o prontuário e deixa as abas preenchidas (setTimeout do componente incluído). */
  function abrir(): void {
    // Como no app: a resposta do back dispara a detecção de mudanças antes do setTimeout que preenche as abas
    fixture.autoDetectChanges(true);
    tick(0);
    tick(0);
    flushMicrotasks();
    fixture.detectChanges();
  }

  it('abre com os dados: busca o prontuário da consulta e preenche as quatro abas', fakeAsync(() => {
    montar();
    abrir();
    expect(api.buscarProntuarioById).toHaveBeenCalledWith(822);
    expect(component.abaIdentificacao.responsavel).toBe('Mae da Ana');
    expect(component.abaExameObjetivo.queixaPrincipal).toBe('Dor');
    expect(component.abaExameObjetivo.pressao).toBe('12/8');
    expect(component.abaCodigosTussCid.Prescricao).toBe('Dipirona');
    expect(component.abaCodigosTussCid.textoTuss).toBe('1. [10101012] Consulta');
    expect(component.abaPlanejamento.planejamentos.length).toBe(1);
    discardTimers();
  }));

  it('na edição, adicionar um código TUSS não apaga o texto salvo (lista reconstruída do texto)', fakeAsync(() => {
    montar();
    abrir();
    const aba = component.abaCodigosTussCid;
    expect(aba.tussSelecionados.map(t => t.codigo)).toEqual(['10101012']);
    aba.adicionarTuss({ codigo: '40304361', descricao: 'Hemograma' });
    expect(aba.textoTuss).toBe('1. [10101012] Consulta\n2. [40304361] Hemograma');
    expect(aba.cidSelecionados.map(c => c.codigo)).toEqual(['J11']);
    discardTimers();
  }));

  it('salvar: confirma e chama PUT atualizarProntuarioMedico(id do prontuário) com o payload do DTO', fakeAsync(() => {
    montar();
    api.atualizarProntuarioMedico.and.returnValue(of({} as any));
    abrir();
    component.abaExameObjetivo.diagnostico = 'Gripe forte';
    component.salvar();
    flushMicrotasks();

    expect(api.atualizarProntuarioMedico).toHaveBeenCalledTimes(1);
    const [id, payload] = api.atualizarProntuarioMedico.calls.mostRecent().args;
    expect(id).toBe(345);
    expect(payload.diagnostico).toBe('Gripe forte');
    expect(payload.responsavel).toBe('Mae da Ana');
    expect(payload.prescricao).toBe('Dipirona');
    expect(payload.tituloPrescricao).toBe('Prescrição Médica');
    expect(payload.tussTexto).toBe('1. [10101012] Consulta');
    expect(payload.codigoMedico).toBe(9);
    expect(payload.consulta).toBe(822);
    // Editar não é finalizar de novo: a data original é mantida
    expect(payload.dataFinalizado).toBe('2026-10-02');
    expect(payload.planejamentos).toEqual([
      { dataProcedimento: '2026-10-02', procedimentoRealizado: 'Retorno', valor: 90, pacienteId: 3 },
    ]);
    expect(notificacao.showSuccessToast).toHaveBeenCalledWith('Prontuário atualizado com sucesso');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    discardTimers();
  }));

  it('salvar cancelado na confirmação não chama o back', fakeAsync(() => {
    montar();
    notificacao.fire.and.resolveTo({ isConfirmed: false } as any);
    abrir();
    component.salvar();
    flushMicrotasks();
    expect(api.atualizarProntuarioMedico).not.toHaveBeenCalled();
    discardTimers();
  }));

  it('erro no PUT mostra a mensagem do back, não fecha o dialog e libera o botão', fakeAsync(() => {
    montar();
    spyOn(console, 'error');
    api.atualizarProntuarioMedico.and.returnValue(throwError(() => ({ status: 404, error: { message: 'Prontuário não encontrado: 345' } })));
    abrir();
    component.salvar();
    flushMicrotasks();
    expect(notificacao.showError).toHaveBeenCalledWith('Prontuário não encontrado: 345');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.salvando).toBeFalse();
    discardTimers();
  }));

  it('falha ao carregar mostra o erro na tela em vez de abas vazias', fakeAsync(() => {
    montar();
    spyOn(console, 'error');
    api.buscarProntuarioById.and.returnValue(throwError(() => ({ status: 404 })).pipe(delay(0)));
    abrir();
    expect(component.erro).toContain('Não foi possível carregar');
    expect(fixture.nativeElement.querySelector('.editar-prontuario-body')).toBeNull();
    discardTimers();
  }));

  /** Descarta timers das abas filhas (ngOnChanges dispara chamadas HTTP falsas). */
  function discardTimers(): void {
    fixture.destroy();
  }
});
