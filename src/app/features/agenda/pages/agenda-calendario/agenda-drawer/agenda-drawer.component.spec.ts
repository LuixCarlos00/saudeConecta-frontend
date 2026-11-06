import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { AgendaDrawerComponent } from './agenda-drawer.component';

/** Ações do drawer: o que cada botão chama, o que avisa e o que pede para a tela (fechar, recarregar, editar). */
describe('AgendaDrawerComponent', () => {
  let component: AgendaDrawerComponent;
  let notificacao: jasmine.SpyObj<any>;
  let consultaService: jasmine.SpyObj<any>;
  let acoesConsulta: jasmine.SpyObj<any>;
  let controleAcesso: jasmine.SpyObj<any>;
  let prontuarioDentista: jasmine.SpyObj<any>;
  let planejamentoApi: jasmine.SpyObj<any>;
  let relatorioService: jasmine.SpyObj<any>;
  let prontuarioState: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<any>;
  let fechar: jasmine.Spy;
  let recarregar: jasmine.Spy;
  let editar: jasmine.Spy;

  const consulta = (id: number, extra: any = {}): any => ({
    id, dataHora: '2026-11-06T09:00:00', status: 'AGENDADA', profissionalId: 1, profissionalNome: 'Dra. Ana',
    especialidadeNome: 'Cardiologia', pacienteNome: 'Maria', ...extra,
  });

  /** Deixa as promises encadeadas (confirmação, fire().then) resolverem. */
  const liberarPromises = async () => { for (let i = 0; i < 4; i++) { await Promise.resolve(); } };

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 6, 10));

    await TestBed.configureTestingModule({
      declarations: [AgendaDrawerComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();

    component = TestBed.createComponent(AgendaDrawerComponent).componentInstance;

    notificacao = jasmine.createSpyObj('NotificacaoService', ['fire', 'mostrarCarregando']);
    notificacao.fire.and.returnValue(Promise.resolve({ isConfirmed: true }));
    consultaService = jasmine.createSpyObj('ConsultaApiService', ['alterarStatusConsulta', 'deletarConsulta']);
    acoesConsulta = jasmine.createSpyObj('AcoesConsultaService', ['gerarLinkWhatsApp', 'buscarProntuarioMaisRecente', 'extrairCodigoProntuario']);
    controleAcesso = jasmine.createSpyObj('ControleAcessoApiService', ['isAdmin', 'isRecepcionista', 'isProfissional']);
    controleAcesso.isAdmin.and.returnValue(false);
    controleAcesso.isRecepcionista.and.returnValue(false);
    controleAcesso.isProfissional.and.returnValue(false);
    prontuarioDentista = jasmine.createSpyObj('ProntuarioDentistaApiService', ['buscarQuestionarioSaude', 'gerarLinkQuestionario']);
    planejamentoApi = jasmine.createSpyObj('PlanejamentoTerapeuticoApiService', ['gerarLinkAssinatura']);
    relatorioService = jasmine.createSpyObj('RelatorioService', ['detectarTipoProfissional', 'abrirRelatorioAdmin']);
    relatorioService.detectarTipoProfissional.and.returnValue('MEDICO');
    prontuarioState = jasmine.createSpyObj('ProntuarioStateService', ['changeConsulta']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    const c = component as any;
    c.notificacao = notificacao;
    c.consultaService = consultaService;
    c.acoesConsulta = acoesConsulta;
    c.controleAcesso = controleAcesso;
    c.prontuarioDentistaApiService = prontuarioDentista;
    c.planejamentoApi = planejamentoApi;
    c.relatorioService = relatorioService;
    c.prontuarioState = prontuarioState;
    c.router = router;

    fechar = jasmine.createSpy('fechar');
    recarregar = jasmine.createSpy('recarregar');
    editar = jasmine.createSpy('editar');
    component.fechar.subscribe(fechar);
    component.recarregar.subscribe(recarregar);
    component.editar.subscribe(editar);
    component.consulta = consulta(10);
    component.aberto = true;
  });

  afterEach(() => jasmine.clock().uninstall());

  it('fechar e editar viram pedidos para a tela', () => {
    component.fecharPopover();
    component.abrirEdicao();
    expect(fechar).toHaveBeenCalledTimes(1);
    expect(editar).toHaveBeenCalledTimes(1);
  });

  describe('permissões por perfil', () => {
    it('só admin e recepção veem todos os profissionais', () => {
      expect(component.podeVerTodosProfissionais()).toBeFalse();
      controleAcesso.isRecepcionista.and.returnValue(true);
      expect(component.podeVerTodosProfissionais()).toBeTrue();
    });

    it('editar: só admin edita agendada; confirmada é bloqueada para admin e profissional', () => {
      controleAcesso.isAdmin.and.returnValue(true);
      expect(component.podeEditarConsulta('AGENDADA')).toBeTrue();
      expect(component.podeEditarConsulta('CONFIRMADA')).toBeFalse();
      controleAcesso.isAdmin.and.returnValue(false);
      controleAcesso.isProfissional.and.returnValue(true);
      expect(component.podeEditarConsulta('AGENDADA')).toBeFalse();
      controleAcesso.isProfissional.and.returnValue(false);
      controleAcesso.isRecepcionista.and.returnValue(true);
      expect(component.podeEditarConsulta('AGENDADA')).toBeFalse();
    });
  });

  describe('alterar status', () => {
    it('para o mesmo status não chama o back', () => {
      component.alterarStatusDrawer('AGENDADA');
      expect(consultaService.alterarStatusConsulta).not.toHaveBeenCalled();
    });

    it('sucesso: avisa, pede para fechar e recarregar, e limpa o aviso em 3 s', () => {
      consultaService.alterarStatusConsulta.and.returnValue(of({}));
      component.alterarStatusDrawer('CONFIRMADA');
      expect(consultaService.alterarStatusConsulta).toHaveBeenCalledWith(10, 'CONFIRMADA');
      expect(component.mensagemTooltipStatus).toBe('Status alterado para Confirmada');
      expect(fechar).toHaveBeenCalled();
      expect(recarregar).toHaveBeenCalled();
      jasmine.clock().tick(3000);
      expect(component.mensagemTooltipStatus).toBe('');
    });

    it('erro: mostra uma mensagem, não recarrega e limpa em 3 s', () => {
      consultaService.alterarStatusConsulta.and.returnValue(throwError(() => ({ error: { message: 'Sem permissão' } })));
      component.alterarStatusDrawer('CONFIRMADA');
      expect(component.mensagemTooltipStatus).toBeTruthy();
      expect(recarregar).not.toHaveBeenCalled();
      jasmine.clock().tick(3000);
      expect(component.mensagemTooltipStatus).toBe('');
    });
  });

  describe('excluir', () => {
    it('pede confirmação e só chama o back se confirmar', async () => {
      notificacao.fire.and.returnValue(Promise.resolve({ isConfirmed: false }));
      component.deletarConsultaDrawer();
      await liberarPromises();
      expect(consultaService.deletarConsulta).not.toHaveBeenCalled();
    });

    it('confirmado: deleta, avisa, fecha e recarrega', async () => {
      consultaService.deletarConsulta.and.returnValue(of({}));
      component.deletarConsultaDrawer();
      await liberarPromises();
      expect(consultaService.deletarConsulta).toHaveBeenCalledWith(10);
      expect(notificacao.fire).toHaveBeenCalledWith('Deletado', 'Consulta deletada com sucesso.', 'success');
      expect(fechar).toHaveBeenCalled();
      expect(recarregar).toHaveBeenCalled();
    });

    it('com prontuário (409) é bloqueado com aviso informativo', async () => {
      consultaService.deletarConsulta.and.returnValue(throwError(() => ({ status: 409 })));
      component.deletarConsultaDrawer();
      await liberarPromises();
      expect(notificacao.fire).toHaveBeenCalledWith('Exclusão bloqueada', jasmine.stringMatching('prontuário clínico'), 'info');
      expect(recarregar).not.toHaveBeenCalled();
    });

    it('outro erro mostra "Erro ao deletar consulta."', async () => {
      consultaService.deletarConsulta.and.returnValue(throwError(() => ({ status: 500 })));
      component.deletarConsultaDrawer();
      await liberarPromises();
      expect(notificacao.fire).toHaveBeenCalledWith('Erro', 'Erro ao deletar consulta.', 'error');
    });
  });

  describe('imprimir e WhatsApp', () => {
    it('imprimir fecha o drawer e abre o relatório depois de 100 ms', () => {
      const c = component.consulta!;
      component.abrirImpressaoDrawer();
      expect(fechar).toHaveBeenCalled();
      expect(relatorioService.abrirRelatorioAdmin).not.toHaveBeenCalled();
      jasmine.clock().tick(100);
      expect(relatorioService.abrirRelatorioAdmin).toHaveBeenCalledWith(c);
    });

    it('WhatsApp vem do AcoesConsultaService', () => {
      acoesConsulta.gerarLinkWhatsApp.and.returnValue('https://wa.me/55');
      expect(component.gerarWhatsAppDrawer()).toBe('https://wa.me/55');
      expect(acoesConsulta.gerarLinkWhatsApp).toHaveBeenCalledWith(component.consulta);
    });
  });

  describe('iniciar / retomar atendimento', () => {
    beforeEach(() => {
      component.consulta = consulta(10, { status: 'CONFIRMADA' });
      component.usuarioLogado = { id: 1, perfil: 'CLINICO', tipoProfissional: 'MEDICO' } as any;
    });

    it('sem rascunho: "Iniciar Atendimento"', () => {
      component.iniciarConsultaDrawer();
      expect(fechar).toHaveBeenCalled();
      jasmine.clock().tick(300);
      const args = notificacao.fire.calls.argsFor(0)[0];
      expect(args.title).toBe('Iniciar Atendimento');
      expect(args.confirmButtonText).toContain('Iniciar Atendimento');
      expect(args.html).toContain('iniciar o atendimento');
    });

    it('com rascunho: "Retomar Atendimento"', () => {
      component.consultasComRascunho = new Set([10]);
      expect(component.temRascunho(component.consulta)).toBeTrue();
      component.iniciarConsultaDrawer();
      jasmine.clock().tick(300);
      const args = notificacao.fire.calls.argsFor(0)[0];
      expect(args.title).toBe('Retomar Atendimento');
      expect(args.confirmButtonText).toContain('Retomar Atendimento');
      expect(args.html).toContain('retomar o atendimento');
    });

    it('temRascunho só vale para consulta com rascunho salvo', () => {
      component.consultasComRascunho = new Set([822]);
      expect(component.temRascunho({ id: 822 } as any)).toBeTrue();
      expect(component.temRascunho({ id: 1 } as any)).toBeFalse();
      expect(component.temRascunho(null)).toBeFalse();
    });

    it('médico vai para startconsulta e guarda a consulta no estado', async () => {
      const selecionada = component.consulta;
      component.iniciarConsultaDrawer();
      jasmine.clock().tick(300);
      await liberarPromises();
      expect(prontuarioState.changeConsulta).toHaveBeenCalledWith(selecionada as any);
      expect(router.navigate).toHaveBeenCalledWith(['startconsulta', 10]);
    });

    it('dentista vai para startconsulta-dentista', async () => {
      component.usuarioLogado = { id: 1, perfil: 'CLINICO', tipoProfissional: 'DENTISTA' } as any;
      component.iniciarConsultaDrawer();
      jasmine.clock().tick(300);
      await liberarPromises();
      expect(router.navigate).toHaveBeenCalledWith(['startconsulta-dentista', 10]);
    });

    it('cancelar não navega', async () => {
      notificacao.fire.and.returnValue(Promise.resolve({ isConfirmed: false }));
      component.iniciarConsultaDrawer();
      jasmine.clock().tick(300);
      await liberarPromises();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('questionário de saúde', () => {
    it('já respondido: marca como respondido e não gera link', () => {
      prontuarioDentista.buscarQuestionarioSaude.and.returnValue(of({ respondido: true }));
      component.gerarLinkQuestionarioDrawer();
      expect(component.questionariosRespondidos.has(10)).toBeTrue();
      expect(prontuarioDentista.gerarLinkQuestionario).not.toHaveBeenCalled();
    });

    it('não respondido: gera o link, copia e mostra o aviso por 3 s', async () => {
      const copiar = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: copiar } as any);
      prontuarioDentista.buscarQuestionarioSaude.and.returnValue(of({ respondido: false }));
      prontuarioDentista.gerarLinkQuestionario.and.returnValue(of({ token: 'abc' }));
      component.gerarLinkQuestionarioDrawer();
      await liberarPromises();
      expect(copiar).toHaveBeenCalledWith(`${window.location.origin}/#/questionario-saude/abc`);
      expect(component.mensagemTooltipQuestionario).toBe('Link copiado para a área de transferência!');
      jasmine.clock().tick(3000);
      expect(component.mensagemTooltipQuestionario).toBe('');
    });

    it('falha ao consultar o questionário ainda tenta gerar o link; falha ao gerar mostra erro', () => {
      prontuarioDentista.buscarQuestionarioSaude.and.returnValue(throwError(() => ({})));
      prontuarioDentista.gerarLinkQuestionario.and.returnValue(throwError(() => ({})));
      component.gerarLinkQuestionarioDrawer();
      expect(prontuarioDentista.gerarLinkQuestionario).toHaveBeenCalledWith(10);
      expect(component.mensagemTooltipQuestionario).toBe('Erro ao gerar link');
    });
  });

  describe('planejamento terapêutico', () => {
    beforeEach(() => { component.consulta = consulta(10, { status: 'REALIZADA' }); });

    it('sem prontuário: aviso', () => {
      acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(of({}));
      acoesConsulta.extrairCodigoProntuario.and.returnValue(null);
      component.gerarLinkPlanejamentoDrawer();
      expect(notificacao.fire).toHaveBeenCalledWith('Aviso', 'Nenhum prontuário encontrado para esta consulta.', 'warning');
      expect(planejamentoApi.gerarLinkAssinatura).not.toHaveBeenCalled();
    });

    it('tudo assinado: marca como assinado e avisa, sem gerar link', () => {
      acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(of({ planejamentosTerapeuticos: [{ statusAssinatura: 'ASSINADO' }] }));
      acoesConsulta.extrairCodigoProntuario.and.returnValue(55);
      component.gerarLinkPlanejamentoDrawer();
      expect(component.planejamentosAssinados.has(10)).toBeTrue();
      expect(planejamentoApi.gerarLinkAssinatura).not.toHaveBeenCalled();
    });

    it('pendente: gera o link com o tipo do profissional e mostra o link', () => {
      spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: () => Promise.resolve() } as any);
      acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(of({ planejamentos: [{ statusAssinatura: 'PENDENTE' }] }));
      acoesConsulta.extrairCodigoProntuario.and.returnValue(55);
      planejamentoApi.gerarLinkAssinatura.and.returnValue(of({ token: 'tok' }));
      component.gerarLinkPlanejamentoDrawer();
      expect(planejamentoApi.gerarLinkAssinatura).toHaveBeenCalledWith(55, 'MEDICO');
      const args = notificacao.fire.calls.mostRecent().args[0];
      expect(args.title).toBe('Link Gerado!');
      expect(args.html).toContain(`${window.location.origin}/#/assinatura-planejamento/tok`);
    });

    it('erro ao buscar o prontuário avisa', () => {
      acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(throwError(() => ({})));
      component.gerarLinkPlanejamentoDrawer();
      expect(notificacao.fire).toHaveBeenCalledWith('Erro', 'Não foi possível buscar o prontuário desta consulta.', 'error');
    });
  });
});
