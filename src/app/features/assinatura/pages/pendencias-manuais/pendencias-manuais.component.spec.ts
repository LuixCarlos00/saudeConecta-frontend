import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { AssinaturaAdminApiService, PendenciaManual } from 'src/app/features/assinatura/data-access/assinatura-admin-api.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { PendenciasManuaisComponent } from './pendencias-manuais.component';

function pendencia(sobrepor: Partial<PendenciaManual> = {}): PendenciaManual {
  return {
    eventoId: 1, tipo: 'subscription_authorized_payment', dataId: 'fat-123', motivoCodigo: 'PAGAMENTO_EM_CORTESIA',
    motivo: 'PAGAMENTO_EM_CORTESIA: assinatura 5, fatura fat-123', erro: null, tentativas: 0,
    recebidoEm: '2026-11-05T10:00:00', expiradoEm: null, organizacaoId: 5, organizacaoNome: 'Policlínica Mar Azul',
    resolvida: false, resolvidoEm: null, resolvidoPorUsuarioId: null, observacaoResolucao: null, ...sobrepor
  };
}

describe('PendenciasManuaisComponent', () => {
  let api: jasmine.SpyObj<AssinaturaAdminApiService>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;
  let fixture: ComponentFixture<PendenciasManuaisComponent>;
  let c: PendenciasManuaisComponent;

  function montar(): void {
    TestBed.configureTestingModule({
      declarations: [PendenciasManuaisComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: AssinaturaAdminApiService, useValue: api },
        { provide: NotificacaoService, useValue: notificacao },
      ],
    });
    fixture = TestBed.createComponent(PendenciasManuaisComponent);
    c = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (seletor: string) => (fixture.nativeElement as HTMLElement).querySelector(seletor) as HTMLElement | null;
  const erroHttp = (status: number, code: string, extra: object = {}) =>
    throwError(() => ({ status, error: { code, message: 'msg do back', ...extra } }));

  beforeEach(() => {
    api = jasmine.createSpyObj('AssinaturaAdminApiService', ['listarPendenciasManuais', 'resolverPendencia']);
    api.listarPendenciasManuais.and.returnValue(of([pendencia()]));
    notificacao = jasmine.createSpyObj('NotificacaoService', ['mostrarToast', 'showError']);
  });

  it('abre listando as abertas, com o significado do motivo e a clínica', () => {
    montar();
    expect(api.listarPendenciasManuais).toHaveBeenCalledOnceWith(false);
    expect(el('[data-testid=motivo-codigo]')?.textContent).toContain('Pagamento em cortesia');
    expect(el('[data-testid=clinica]')?.textContent).toContain('Policlínica Mar Azul');
    expect(fixture.nativeElement.textContent).toContain('Estornar.');
    expect(el('[data-testid=btn-resolver]')).not.toBeNull();
  });

  it('a legenda traz os cinco motivos', () => {
    montar();
    expect(fixture.nativeElement.querySelectorAll('[data-testid=legenda] dt').length).toBe(5);
  });

  it('código desconhecido mostra o código e o texto do back; sem clínica mostra "não identificada"', () => {
    api.listarPendenciasManuais.and.returnValue(of([pendencia({ motivoCodigo: 'NOVO', motivo: 'texto do back', organizacaoNome: null, organizacaoId: null })]));
    montar();
    expect(el('[data-testid=motivo-codigo]')?.textContent).toContain('NOVO');
    expect(fixture.nativeElement.textContent).toContain('texto do back');
    expect(el('[data-testid=clinica]')?.textContent).toContain('Clínica não identificada');
  });

  it('lista vazia mostra mensagem por aba', () => {
    api.listarPendenciasManuais.and.returnValue(of([]));
    montar();
    expect(el('[data-testid=vazio]')?.textContent).toContain('Nenhuma pendência aberta');
    c.alternar(true);
    fixture.detectChanges();
    expect(el('[data-testid=vazio]')?.textContent).toContain('Nenhuma pendência resolvida');
  });

  it('alternar para resolvidas recarrega com resolvidas=true e mostra a resolução, sem botão Resolver', () => {
    montar();
    api.listarPendenciasManuais.and.returnValue(of([pendencia({ resolvida: true, resolvidoEm: '2026-11-05T15:30:00', observacaoResolucao: 'Estornado' })]));
    c.alternar(true);
    fixture.detectChanges();
    expect(api.listarPendenciasManuais).toHaveBeenCalledWith(true);
    expect(el('[data-testid=resolucao]')?.textContent).toContain('Estornado');
    expect(el('[data-testid=btn-resolver]')).toBeNull();
  });

  it('erro ao listar mostra a mensagem e permite tentar de novo', () => {
    api.listarPendenciasManuais.and.returnValue(erroHttp(403, 'ACESSO_NEGADO'));
    montar();
    expect(el('[data-testid=erro]')?.textContent).toContain('permissão');
    expect(c.pendencias).toEqual([]);
  });

  describe('resolver', () => {
    beforeEach(() => montar());

    function abrirEPreencher(texto: string): void {
      c.iniciarResolucao(c.pendencias[0]);
      c.observacao = texto;
    }

    it('observação vazia ou só espaços não chama o back e mostra o erro no campo', () => {
      abrirEPreencher('   ');
      c.confirmarResolucao(c.pendencias[0]);
      expect(api.resolverPendencia).not.toHaveBeenCalled();
      expect(c.erroObservacao).toContain('obrigatória');
    });

    it('observação acima de 500 caracteres não chama o back; exatamente 500 passa', () => {
      api.resolverPendencia.and.returnValue(of(pendencia({ resolvida: true })));
      abrirEPreencher('a'.repeat(501));
      c.confirmarResolucao(c.pendencias[0]);
      expect(api.resolverPendencia).not.toHaveBeenCalled();
      expect(c.erroObservacao).toContain('500');
      c.observacao = 'a'.repeat(500);
      c.confirmarResolucao(c.pendencias[0]);
      expect(api.resolverPendencia).toHaveBeenCalledOnceWith(1, 'a'.repeat(500));
    });

    it('o formulário limita o campo a 500 caracteres e mostra o contador', () => {
      c.iniciarResolucao(c.pendencias[0]);
      c.observacao = 'abc';
      fixture.detectChanges();
      expect(el('[data-testid=observacao]')?.getAttribute('maxlength')).toBe('500');
      expect(el('[data-testid=contador]')?.textContent).toContain('/500');
    });

    it('sucesso envia a observação aparada, fecha o formulário, avisa e recarrega', () => {
      api.resolverPendencia.and.returnValue(of(pendencia({ resolvida: true })));
      api.listarPendenciasManuais.calls.reset();
      abrirEPreencher('  Estornado no painel do MP  ');
      c.confirmarResolucao(c.pendencias[0]);
      expect(api.resolverPendencia).toHaveBeenCalledOnceWith(1, 'Estornado no painel do MP');
      expect(c.resolvendoId).toBeNull();
      expect(notificacao.mostrarToast).toHaveBeenCalledWith('success', 'Pendência resolvida');
      expect(api.listarPendenciasManuais).toHaveBeenCalledTimes(1);
      expect(c.salvando).toBeFalse();
    });

    it('400 VALIDACAO mostra a mensagem do campo e mantém o formulário aberto', () => {
      api.resolverPendencia.and.returnValue(erroHttp(400, 'VALIDACAO', { errors: { observacao: 'tamanho inválido' } }));
      abrirEPreencher('x');
      c.confirmarResolucao(c.pendencias[0]);
      expect(c.erroObservacao).toBe('tamanho inválido');
      expect(c.resolvendoId).toBe(1);
      expect(notificacao.showError).not.toHaveBeenCalled();
      expect(c.salvando).toBeFalse();
    });

    it('409 PENDENCIA_JA_RESOLVIDA avisa e recarrega a lista', () => {
      api.resolverPendencia.and.returnValue(erroHttp(409, 'PENDENCIA_JA_RESOLVIDA'));
      api.listarPendenciasManuais.calls.reset();
      abrirEPreencher('x');
      c.confirmarResolucao(c.pendencias[0]);
      expect(notificacao.showError).toHaveBeenCalledWith(jasmine.stringContaining('já foi resolvida'));
      expect(api.listarPendenciasManuais).toHaveBeenCalledTimes(1);
      expect(c.resolvendoId).toBeNull();
    });

    it('404 avisa e recarrega a lista', () => {
      api.resolverPendencia.and.returnValue(erroHttp(404, 'NAO_ENCONTRADO'));
      api.listarPendenciasManuais.calls.reset();
      abrirEPreencher('x');
      c.confirmarResolucao(c.pendencias[0]);
      expect(notificacao.showError).toHaveBeenCalledWith('O registro não existe mais; a lista foi atualizada.');
      expect(api.listarPendenciasManuais).toHaveBeenCalledTimes(1);
    });

    it('cancelar fecha o formulário sem chamar o back e abrir outro troca o formulário', () => {
      abrirEPreencher('rascunho');
      c.cancelarResolucao();
      expect(c.resolvendoId).toBeNull();
      expect(c.observacao).toBe('');
      expect(api.resolverPendencia).not.toHaveBeenCalled();
      c.iniciarResolucao(pendencia({ eventoId: 9 }));
      expect(c.resolvendoId).toBe(9);
    });

    it('clique duplo enquanto salva não envia duas vezes', () => {
      api.resolverPendencia.and.returnValue(new Subject<PendenciaManual>());
      abrirEPreencher('x');
      c.confirmarResolucao(c.pendencias[0]);
      c.confirmarResolucao(c.pendencias[0]);
      expect(api.resolverPendencia).toHaveBeenCalledTimes(1);
    });
  });
});
