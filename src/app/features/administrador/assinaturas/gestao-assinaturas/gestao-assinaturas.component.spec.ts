import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { AssinaturaAdminApiService, AssinaturaResumoAdmin } from 'src/app/services/api/assinatura-admin-api.service';
import { AssinaturaApiService } from 'src/app/core/data-access/assinatura-api.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { ModalAssociarPlanoComponent } from '../../gerenciamento-usuarios/tabela-todos-usuarios/modal-associar-plano/modal-associar-plano.component';
import { GestaoAssinaturasComponent } from './gestao-assinaturas.component';

function linha(sobrepor: Partial<AssinaturaResumoAdmin> = {}): AssinaturaResumoAdmin {
  return {
    assinaturaId: 1, organizacaoId: 10, organizacaoNome: 'Clínica Vida Plena', planoId: 3, planoNome: 'Business',
    planoTipo: 'BUSINESS', status: 'ATIVA', valorMensal: 549, cortesia: false, dataVencimento: '2026-11-29',
    mpStatus: 'authorized', temPreapproval: true, preapprovalSubstituidoPendente: false, ...sobrepor
  };
}

const pagina = (content: AssinaturaResumoAdmin[], totalElements = content.length) =>
  ({ content, totalElements, totalPages: 1, number: 0, size: 20 });

describe('GestaoAssinaturasComponent', () => {
  let admin: jasmine.SpyObj<AssinaturaAdminApiService>;
  let api: jasmine.SpyObj<AssinaturaApiService>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let fixture: ComponentFixture<GestaoAssinaturasComponent>;
  let c: GestaoAssinaturasComponent;

  function montar(): void {
    TestBed.configureTestingModule({
      declarations: [GestaoAssinaturasComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: AssinaturaAdminApiService, useValue: admin },
        { provide: AssinaturaApiService, useValue: api },
        { provide: NotificacaoService, useValue: notificacao },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    fixture = TestBed.createComponent(GestaoAssinaturasComponent);
    c = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (seletor: string) => (fixture.nativeElement as HTMLElement).querySelector(seletor) as HTMLElement | null;
  const todos = (seletor: string) => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(seletor)) as HTMLElement[];
  const erroHttp = (status: number, code: string) => throwError(() => ({ status, error: { code, message: 'msg do back' } }));
  const ultimaChamada = () => admin.listar.calls.mostRecent().args[0]!;
  /** Deixa a confirmação do alerta respondida e espera a promessa resolver. */
  async function confirmando(confirmado: boolean, acao: () => void): Promise<void> {
    notificacao.fire.and.resolveTo({ isConfirmed: confirmado } as any);
    acao();
    await Promise.resolve();
  }

  beforeEach(() => {
    admin = jasmine.createSpyObj('AssinaturaAdminApiService', ['listar']);
    admin.listar.and.returnValue(of(pagina([linha()])));
    api = jasmine.createSpyObj('AssinaturaApiService', ['definirCortesia', 'suspender', 'cancelar']);
    notificacao = jasmine.createSpyObj('NotificacaoService', ['fire', 'mostrarToast', 'showError']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
  });

  describe('listagem', () => {
    it('abre na página 0, 20 por página, ordenada por nome da clínica', () => {
      montar();
      expect(admin.listar).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        page: 0, size: 20, sort: 'organizacaoNome,asc', status: '', plano: '', cortesia: null, busca: ''
      }));
      expect(todos('[data-testid=linha-assinatura]').length).toBe(1);
      expect(el('[data-testid=linha-assinatura]')?.textContent).toContain('Clínica Vida Plena');
      expect(el('[data-testid=linha-assinatura]')?.textContent).toContain('29/11/2026');
    });

    it('lista vazia mostra mensagem; com filtro ligado diz "para esses filtros"', () => {
      admin.listar.and.returnValue(of(pagina([])));
      montar();
      expect(el('[data-testid=vazio]')?.textContent).toContain('Nenhuma assinatura encontrada.');
      c.filtroBusca = 'xyz';
      fixture.detectChanges();
      expect(el('[data-testid=vazio]')?.textContent).toContain('para esses filtros');
    });

    it('indicador de preapproval substituído e selo de cortesia só aparecem quando verdadeiros', () => {
      admin.listar.and.returnValue(of(pagina([
        linha({ assinaturaId: 1 }),
        linha({ assinaturaId: 2, organizacaoNome: 'B', preapprovalSubstituidoPendente: true, cortesia: true }),
      ])));
      montar();
      const [a, b] = todos('[data-testid=linha-assinatura]');
      expect(a.querySelector('[data-testid=selo-substituido]')).toBeNull();
      expect(a.querySelector('[data-testid=selo-cortesia]')).toBeNull();
      expect(b.querySelector('[data-testid=selo-substituido]')).not.toBeNull();
      expect(b.querySelector('[data-testid=selo-cortesia]')).not.toBeNull();
    });

    it('erro mostra a mensagem por code e esconde a tabela', () => {
      admin.listar.and.returnValue(erroHttp(400, 'PARAMETRO_INVALIDO'));
      montar();
      expect(el('[data-testid=erro]')?.textContent).toContain('msg do back');
      expect(el('[data-testid=tabela-assinaturas]')).toBeNull();
      expect(c.total).toBe(0);
    });

    it('resposta de uma chamada antiga é descartada', () => {
      const primeira = new Subject<any>();
      admin.listar.and.returnValue(primeira);
      montar();
      admin.listar.and.returnValue(of(pagina([linha({ organizacaoNome: 'Nova' })])));
      c.carregar();
      primeira.next(pagina([linha({ organizacaoNome: 'Velha' })]));
      expect(c.itens[0].organizacaoNome).toBe('Nova');
    });
  });

  describe('filtros, ordenação e paginação', () => {
    beforeEach(() => montar());

    it('aplicar filtros manda status, plano, cortesia (booleano) e busca e volta para a página 0', () => {
      c.pagina = 3;
      c.filtroStatus = 'SUSPENSA';
      c.filtroPlano = 'STARTER';
      c.filtroCortesia = 'true';
      c.filtroBusca = 'vida';
      c.aplicarFiltros();
      expect(ultimaChamada()).toEqual(jasmine.objectContaining({
        status: 'SUSPENSA', plano: 'STARTER', cortesia: true, busca: 'vida', page: 0
      }));
      c.filtroCortesia = 'false';
      c.aplicarFiltros();
      expect(ultimaChamada().cortesia).toBeFalse();
    });

    it('limpar zera os filtros e recarrega; só fica habilitado com filtro ligado', () => {
      expect(c.temFiltro).toBeFalse();
      c.filtroStatus = 'ATIVA';
      c.filtroBusca = '  ';
      expect(c.temFiltro).toBeTrue();
      c.limparFiltros();
      expect(c.temFiltro).toBeFalse();
      expect(ultimaChamada()).toEqual(jasmine.objectContaining({ status: '', cortesia: null, busca: '', page: 0 }));
    });

    it('ordenar por outra coluna começa ascendente; repetir inverte o sentido', () => {
      c.ordenarPor('valorMensal');
      expect(ultimaChamada().sort).toBe('valorMensal,asc');
      expect(c.ariaSort('valorMensal')).toBe('ascending');
      expect(c.ariaSort('status')).toBe('none');
      c.ordenarPor('valorMensal');
      expect(ultimaChamada().sort).toBe('valorMensal,desc');
      expect(c.ariaSort('valorMensal')).toBe('descending');
    });

    it('trocar a ordenação volta para a página 0', () => {
      c.mudarPagina({ pageIndex: 2, pageSize: 20, length: 100 } as any);
      c.ordenarPor('dataVencimento');
      expect(ultimaChamada().page).toBe(0);
    });

    it('texto de busca digitado e não aplicado não vaza em ordenar, paginar ou recarregar', () => {
      c.filtroBusca = 'digitado';
      c.ordenarPor('status');
      expect(ultimaChamada().busca).toBe('');
      c.mudarPagina({ pageIndex: 1, pageSize: 20, length: 100 } as any);
      expect(ultimaChamada().busca).toBe('');
      c.aplicarFiltros();
      expect(ultimaChamada().busca).toBe('digitado');
      c.filtroBusca = 'outro';
      c.carregar();
      expect(ultimaChamada().busca).toBe('digitado');
    });

    it('página que vem vazia depois da primeira recua uma página e recarrega', () => {
      c.pagina = 2;
      admin.listar.calls.reset();
      admin.listar.and.returnValues(of(pagina([], 40)), of(pagina([linha()], 40)));
      c.carregar();
      expect(admin.listar.calls.allArgs().map(a => a[0]!.page)).toEqual([2, 1]);
      expect(c.pagina).toBe(1);
      expect(c.itens.length).toBe(1);
    });

    it('página 0 vazia não recua nem entra em laço', () => {
      admin.listar.calls.reset();
      admin.listar.and.returnValue(of(pagina([])));
      c.carregar();
      expect(admin.listar).toHaveBeenCalledTimes(1);
      expect(c.pagina).toBe(0);
    });

    it('mudar de página ou de tamanho refaz a chamada', () => {
      c.mudarPagina({ pageIndex: 2, pageSize: 50, length: 200 } as any);
      expect(ultimaChamada()).toEqual(jasmine.objectContaining({ page: 2, size: 50 }));
    });
  });

  describe('ações por linha', () => {
    const item = () => c.itens[0];

    it('cortesia: pede confirmação, chama PATCH cortesia=true, avisa e recarrega', async () => {
      montar();
      api.definirCortesia.and.returnValue(of({} as any));
      admin.listar.calls.reset();
      await confirmando(true, () => c.alternarCortesia(item()));
      expect(notificacao.fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Dar cortesia?', showCancelButton: true }));
      expect(api.definirCortesia).toHaveBeenCalledOnceWith(1, true);
      expect(notificacao.mostrarToast).toHaveBeenCalledWith('success', 'Cortesia concedida');
      expect(admin.listar).toHaveBeenCalledTimes(1);
      expect(c.acaoEmAndamento).toBeNull();
    });

    it('cortesia ligada: o botão remove (cortesia=false)', async () => {
      admin.listar.and.returnValue(of(pagina([linha({ cortesia: true })])));
      montar();
      api.definirCortesia.and.returnValue(of({} as any));
      expect(el('[data-testid=btn-cortesia]')?.textContent).toContain('Remover cortesia');
      await confirmando(true, () => c.alternarCortesia(item()));
      expect(api.definirCortesia).toHaveBeenCalledOnceWith(1, false);
    });

    it('suspender e cancelar chamam as rotas do contrato depois de confirmar', async () => {
      montar();
      api.suspender.and.returnValue(of(undefined));
      api.cancelar.and.returnValue(of(undefined));
      await confirmando(true, () => c.suspender(item()));
      expect(api.suspender).toHaveBeenCalledOnceWith(1);
      await confirmando(true, () => c.cancelar(item()));
      expect(api.cancelar).toHaveBeenCalledOnceWith(1);
      expect(notificacao.fire.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ title: 'Cancelar assinatura?' }));
    });

    it('recusar a confirmação não chama o back', async () => {
      montar();
      await confirmando(false, () => c.cancelar(item()));
      await confirmando(false, () => c.suspender(item()));
      await confirmando(false, () => c.alternarCortesia(item()));
      expect(api.cancelar).not.toHaveBeenCalled();
      expect(api.suspender).not.toHaveBeenCalled();
      expect(api.definirCortesia).not.toHaveBeenCalled();
    });

    it('409 PREAPPROVAL_SUBSTITUIDO_EM_ANALISE na cortesia mostra o texto do contrato e recarrega', async () => {
      montar();
      api.definirCortesia.and.returnValue(erroHttp(409, 'PREAPPROVAL_SUBSTITUIDO_EM_ANALISE'));
      admin.listar.calls.reset();
      await confirmando(true, () => c.alternarCortesia(item()));
      expect(notificacao.showError).toHaveBeenCalledWith('Há um pagamento anterior em análise. Resolva a pendência no Mercado Pago antes.');
      expect(notificacao.mostrarToast).not.toHaveBeenCalled();
      expect(admin.listar).toHaveBeenCalledTimes(1);
      expect(c.acaoEmAndamento).toBeNull();
    });

    it('409 ASSINATURA_CANCELADA ao suspender e 502 BUSINESS_ERROR ao cancelar mostram mensagem e liberam a linha', async () => {
      montar();
      api.suspender.and.returnValue(erroHttp(409, 'ASSINATURA_CANCELADA'));
      await confirmando(true, () => c.suspender(item()));
      expect(notificacao.showError).toHaveBeenCalledWith(jasmine.stringContaining('cancelada'));
      api.cancelar.and.returnValue(erroHttp(502, 'BUSINESS_ERROR'));
      await confirmando(true, () => c.cancelar(item()));
      expect(notificacao.showError).toHaveBeenCalledWith('msg do back');
      expect(c.acaoEmAndamento).toBeNull();
    });

    it('404 e 503 também viram mensagem (503 sem code fala da integração)', async () => {
      montar();
      api.cancelar.and.returnValue(erroHttp(404, 'NAO_ENCONTRADO'));
      await confirmando(true, () => c.cancelar(item()));
      expect(notificacao.showError).toHaveBeenCalledWith('O registro não existe mais; a lista foi atualizada.');
      api.cancelar.and.returnValue(throwError(() => ({ status: 503, error: {} })));
      await confirmando(true, () => c.cancelar(item()));
      expect(notificacao.showError).toHaveBeenCalledWith(jasmine.stringContaining('Mercado Pago indisponível'));
    });

    it('com uma ação em andamento, outra confirmação não dispara a segunda chamada', async () => {
      montar();
      api.suspender.and.returnValue(new Subject<void>());
      await confirmando(true, () => c.suspender(item()));
      expect(c.acaoEmAndamento).toBe(1);
      await confirmando(true, () => c.cancelar(item()));
      expect(api.cancelar).not.toHaveBeenCalled();
    });

    it('o nome da clínica é escapado no HTML do alerta', async () => {
      admin.listar.and.returnValue(of(pagina([linha({ organizacaoNome: '<img src=x onerror=alert(1)>' })])));
      montar();
      await confirmando(false, () => c.cancelar(item()));
      const html = (notificacao.fire.calls.mostRecent().args[0] as any).html as string;
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });

    it('assinatura CANCELADA: só "Nova assinatura"; suspensa não oferece suspender', () => {
      admin.listar.and.returnValue(of(pagina([
        linha({ assinaturaId: 1, status: 'CANCELADA' }),
        linha({ assinaturaId: 2, status: 'SUSPENSA' }),
      ])));
      montar();
      const [cancelada, suspensa] = todos('[data-testid=linha-assinatura]');
      expect(cancelada.querySelector('[data-testid=btn-associar]')?.textContent).toContain('Nova assinatura');
      expect(cancelada.querySelector('[data-testid=btn-cortesia]')).toBeNull();
      expect(cancelada.querySelector('[data-testid=btn-suspender]')).toBeNull();
      expect(cancelada.querySelector('[data-testid=btn-cancelar]')).toBeNull();
      expect(suspensa.querySelector('[data-testid=btn-suspender]')).toBeNull();
      expect(suspensa.querySelector('[data-testid=btn-cancelar]')).not.toBeNull();
    });
  });

  describe('associar plano', () => {
    it('abre o modal com a organização da linha e recarrega quando alterou', () => {
      montar();
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);
      admin.listar.calls.reset();
      c.associarPlano(c.itens[0]);
      expect(dialog.open).toHaveBeenCalledWith(ModalAssociarPlanoComponent, jasmine.objectContaining({
        data: { organizacaoId: 10, nomeOrganizacao: 'Clínica Vida Plena' }
      }));
      expect(admin.listar).toHaveBeenCalledTimes(1);
    });

    it('fechar o modal sem alterar não recarrega', () => {
      montar();
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      admin.listar.calls.reset();
      c.associarPlano(c.itens[0]);
      expect(admin.listar).not.toHaveBeenCalled();
    });
  });
});
