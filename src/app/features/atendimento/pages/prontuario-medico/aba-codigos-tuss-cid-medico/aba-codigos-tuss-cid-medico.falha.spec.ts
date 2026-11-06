import { TestBed } from '@angular/core/testing';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { CodigosTussCidService } from 'src/app/features/atendimento/data-access/codigos/codigos-tuss-cid.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { AbaCodigosTussCidMedicoComponent } from './aba-codigos-tuss-cid-medico.component';

/** Falha ao baixar as tabelas CID/TUSS: avisa o usuário uma vez e não deixa promise rejeitada solta. */
describe('AbaCodigosTussCidMedicoComponent: falha ao carregar as tabelas de códigos', () => {
  let aba: AbaCodigosTussCidMedicoComponent;
  let codigos: jasmine.SpyObj<CodigosTussCidService>;
  let notificacao: jasmine.SpyObj<NotificacaoService>;
  const MENSAGEM = 'Não foi possível carregar a tabela de códigos. Tente de novo.';

  beforeEach(() => {
    codigos = jasmine.createSpyObj('CodigosTussCidService', ['buscarTuss', 'buscarCid']);
    notificacao = jasmine.createSpyObj('NotificacaoService', ['fire']);
    TestBed.configureTestingModule({
      declarations: [AbaCodigosTussCidMedicoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
      providers: [
        { provide: CodigosTussCidService, useValue: codigos },
        { provide: NotificacaoService, useValue: notificacao },
      ],
    });
    aba = TestBed.createComponent(AbaCodigosTussCidMedicoComponent).componentInstance;
  });

  it('TUSS: avisa pelo NotificacaoService e mantém o autocomplete vazio', async () => {
    codigos.buscarTuss.and.rejectWith(new Error('rede'));
    aba.buscaTuss = 'consulta';
    await aba.filtrarTuss();
    expect(notificacao.fire).toHaveBeenCalledOnceWith('Erro', MENSAGEM, 'error');
    expect(aba.tussResultados).toEqual([]);
  });

  it('CID: avisa pelo NotificacaoService', async () => {
    codigos.buscarCid.and.rejectWith(new Error('rede'));
    aba.buscaCid = 'cólera';
    await aba.filtrarCid();
    expect(notificacao.fire).toHaveBeenCalledOnceWith('Erro', MENSAGEM, 'error');
  });

  it('não repete o aviso a cada tecla', async () => {
    codigos.buscarTuss.and.rejectWith(new Error('rede'));
    aba.buscaTuss = 'co';
    await aba.filtrarTuss();
    aba.buscaTuss = 'con';
    await aba.filtrarTuss();
    aba.buscaTuss = 'cons';
    await aba.filtrarTuss();
    expect(notificacao.fire).toHaveBeenCalledTimes(1);
  });

  it('depois de uma busca que dá certo, uma nova falha avisa de novo', async () => {
    codigos.buscarTuss.and.rejectWith(new Error('rede'));
    aba.buscaTuss = 'co';
    await aba.filtrarTuss();
    codigos.buscarTuss.and.resolveTo([{ codigo: '1', descricao: 'Consulta', fabricante: 'x', tabela: 22 }]);
    aba.buscaTuss = 'con';
    await aba.filtrarTuss();
    expect(aba.tussResultados.length).toBe(1);
    codigos.buscarTuss.and.rejectWith(new Error('rede'));
    aba.buscaTuss = 'cons';
    await aba.filtrarTuss();
    expect(notificacao.fire).toHaveBeenCalledTimes(2);
  });
});
