import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { delay, of, throwError } from 'rxjs';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';
import { AbaCodigosTussCidComponent } from '../aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';
import { AbaExameObjetivoComponent } from '../aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaIdentificacaoComponent } from '../aba-identificacao/aba-identificacao.component';
import { AbaPlanejamentoComponent } from '../aba-planejamento/aba-planejamento.component';
import { EditarProntuarioDentistaComponent } from './editar-prontuario-dentista.component';

describe('EditarProntuarioDentistaComponent', () => {
  let fixture: ComponentFixture<EditarProntuarioDentistaComponent>;
  let component: EditarProntuarioDentistaComponent;
  let api: jasmine.SpyObj<ProntuarioDentistaApiService>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EditarProntuarioDentistaComponent>>;

  const consulta = { id: 900, pacienteId: 4, profissionalId: 12, pacienteNome: 'Beto' };
  const prontuario: any = {
    codigo: 77,
    responsavel: 'Pai do Beto',
    queixaPrincipal: 'Dor no 16', anamnese: 'Sensibilidade', observacao: 'Obs', higieneBucal: 'Regular',
    condicaoGengival: 'Sangramento', oclusal: 'Normal', atm: 'Sem estalos', diagnostico: 'Carie',
    pressaoArterial: '12/8', pulso: '70', peso: '80', altura: '1.80', temperatura: '36',
    orientacoes: 'Escovar', prescricao: 'Amoxicilina', tussTexto: '1. [81000065] Consulta odontologica',
    cidTexto: '1. [K02] Carie dentaria', solicitacaoExameTexto: 'TUSS:\n  1. [40808017] Radiografia',
    planoTratamento: 'Restaurar o 16', procedimentos: 'Restauracao', tituloExame: 'Raio X', dataExame: '2026-10-10',
    dataPrescricao: '2026-10-10',
    dentes: [{ codigo: 1, numeroFdi: 16, status: 'cariado', observacao: 'oclusal' }],
    planejamentos: [
      { id: 1, dataProcedimento: '2026-10-10', procedimentoRealizado: 'Profilaxia', valor: 150, statusAssinatura: 'ASSINADO' },
      { id: 2, dataProcedimento: '2026-10-17', procedimentoRealizado: 'Restauracao', valor: 250, statusAssinatura: 'PENDENTE' },
    ],
  };

  function montar(): void {
    api = jasmine.createSpyObj('ProntuarioDentistaApiService', ['buscarProntuarioDentistaById', 'atualizarProntuario']);
    // Assíncrono como o HTTP real (resposta síncrona dispara NG0100 em modo dev, só no teste)
    api.buscarProntuarioDentistaById.and.returnValue(of(prontuario).pipe(delay(0)));
    notificacao = jasmine.createSpyObj('NotificacaoService', ['showError', 'showSuccessToast', 'fire']);
    notificacao.fire.and.resolveTo({ isConfirmed: true } as any);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      declarations: [
        EditarProntuarioDentistaComponent, AbaIdentificacaoComponent, AbaExameObjetivoComponent,
        AbaCodigosTussCidComponent, AbaPlanejamentoComponent,
      ],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: ProntuarioDentistaApiService, useValue: api },
        { provide: NotificacaoService, useValue: notificacao },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { consulta } },
      ],
    });
    fixture = TestBed.createComponent(EditarProntuarioDentistaComponent);
    component = fixture.componentInstance;
  }

  function abrir(): void {
    // Como no app: a resposta do back dispara a detecção de mudanças antes do setTimeout que preenche as abas
    fixture.autoDetectChanges(true);
    tick(0);
    tick(0);
    flushMicrotasks();
    fixture.detectChanges();
  }

  it('abre com os dados: busca o prontuário recente da consulta e preenche as abas', fakeAsync(() => {
    montar();
    abrir();
    expect(api.buscarProntuarioDentistaById).toHaveBeenCalledWith(900);
    expect(component.abaIdentificacao.responsavel).toBe('Pai do Beto');
    expect(component.abaExameObjetivo.QueixaPrincipal).toBe('Dor no 16');
    expect(component.abaExameObjetivo.pressaoArterial).toBe('12/8');
    expect(component.abaExameObjetivo.odontograma.find(d => d.numero === 16)?.status).toBe('cariado');
    expect(component.abaCodigosTussCid.Prescricao).toBe('Amoxicilina');
    expect(component.abaPlanejamento.planejamentos.length).toBe(2);
    fixture.destroy();
  }));

  it('na edição, adicionar CID e exame não apaga os textos salvos (listas reconstruídas)', fakeAsync(() => {
    montar();
    abrir();
    const aba = component.abaCodigosTussCid;
    aba.adicionarCid({ codigo: 'K04', label: 'Doenças da polpa' });
    expect(aba.textoCid).toBe('1. [K02] Carie dentaria\n2. [K04] Doenças da polpa');
    aba.adicionarTussExame({ codigo: '40808025', descricao: 'Panoramica' });
    expect(aba.textoSolicitacaoExame).toBe('TUSS:\n  1. [40808017] Radiografia\n  2. [40808025] Panoramica');
    fixture.destroy();
  }));

  it('salvar: PUT /prontuario-dentista/{id} com TODOS os planejamentos e os campos que nenhuma aba edita', fakeAsync(() => {
    montar();
    api.atualizarProntuario.and.returnValue(of(undefined));
    abrir();
    component.abaExameObjetivo.Diagnostico = 'Carie profunda';
    component.salvar();
    flushMicrotasks();

    expect(api.atualizarProntuario).toHaveBeenCalledTimes(1);
    const [id, payload] = api.atualizarProntuario.calls.mostRecent().args;
    expect(id).toBe(77);
    expect(payload.diagnostico).toBe('Carie profunda');
    expect(payload.responsavel).toBe('Pai do Beto');
    expect(payload.prescricao).toBe('Amoxicilina');
    expect(payload.tituloPrescricao).toBe('Prescrição Odontológica');
    expect(payload.odontograma.some((d: any) => d.numeroFdi === 16 && d.status === 'cariado')).toBeTrue();
    expect(payload.codigoMedico).toBe(12);
    expect(payload.consulta).toBe(900);
    // O back zera o que não vem no payload: estes campos têm de voltar como estavam
    expect(payload.planoTratamento).toBe('Restaurar o 16');
    expect(payload.procedimentos).toBe('Restauracao');
    expect(payload.tituloExame).toBe('Raio X');
    expect(payload.dataExame).toBe('2026-10-10');
    expect(payload.dataPrescricao).toBe('2026-10-10');
    // O back apaga e recria os planejamentos: os já gravados também precisam ir
    expect(payload.planejamentos).toEqual([
      { dataProcedimento: '2026-10-10', procedimentoRealizado: 'Profilaxia', valor: 150, pacienteId: 4 },
      { dataProcedimento: '2026-10-17', procedimentoRealizado: 'Restauracao', valor: 250, pacienteId: 4 },
    ]);
    expect(notificacao.showSuccessToast).toHaveBeenCalledWith('Prontuário atualizado com sucesso');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    fixture.destroy();
  }));

  it('erro no PUT mostra a mensagem do back, não fecha o dialog e libera o botão', fakeAsync(() => {
    montar();
    spyOn(console, 'error');
    api.atualizarProntuario.and.returnValue(throwError(() => ({ status: 400, error: { message: 'Dados inválidos' } })));
    abrir();
    component.salvar();
    flushMicrotasks();
    expect(notificacao.showError).toHaveBeenCalledWith('Dados inválidos');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.salvando).toBeFalse();
    fixture.destroy();
  }));

  it('falha ao carregar mostra o erro na tela', fakeAsync(() => {
    montar();
    spyOn(console, 'error');
    api.buscarProntuarioDentistaById.and.returnValue(throwError(() => ({ status: 404 })).pipe(delay(0)));
    abrir();
    expect(component.erro).toContain('Não foi possível carregar');
    fixture.destroy();
  }));
});
