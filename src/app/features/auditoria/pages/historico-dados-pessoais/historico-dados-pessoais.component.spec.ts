import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HistoricoDadosPessoaisApiService } from 'src/app/features/auditoria/data-access/historico-dados-pessoais-api.service';
import { AssinaturaAdminApiService } from 'src/app/features/assinatura';
import { HistoricoDadosPessoaisComponent } from './historico-dados-pessoais.component';

describe('HistoricoDadosPessoaisComponent (auditoria)', () => {
  let fixture: ComponentFixture<HistoricoDadosPessoaisComponent>;
  let c: HistoricoDadosPessoaisComponent;
  let api: jasmine.SpyObj<HistoricoDadosPessoaisApiService>;

  const linha = {
    id: 1, criadoEm: '2026-11-18T10:00:00', organizacaoId: 7, organizacaoNome: 'Clínica Vida',
    usuarioId: 2, usuarioLogin: '28617486000120', usuarioNome: 'Bianca Batista', usuarioPerfil: 'Administrador', entidade: 'SECRETARIA' as const, idEntidade: 4,
    campo: 'telefone', valorAnterior: '1100', valorNovo: '1199'
  };
  const pagina = (n = 1, totalPages = 1) => ({ content: [linha], totalElements: n, totalPages, number: 0, size: 20 });

  beforeEach(() => {
    api = jasmine.createSpyObj('HistoricoDadosPessoaisApiService', ['pesquisar']);
    api.pesquisar.and.returnValue(of(pagina()));
    const assinaturas = jasmine.createSpyObj('AssinaturaAdminApiService', ['listar']);
    assinaturas.listar.and.returnValue(of({
      content: [{ organizacaoId: 7, organizacaoNome: 'Clínica Vida' }, { organizacaoId: 7, organizacaoNome: 'Clínica Vida' }],
      totalElements: 2, totalPages: 1, number: 0, size: 100
    }));
    TestBed.configureTestingModule({
      imports: [HistoricoDadosPessoaisComponent],
      providers: [
        { provide: HistoricoDadosPessoaisApiService, useValue: api },
        { provide: AssinaturaAdminApiService, useValue: assinaturas }
      ]
    });
    fixture = TestBed.createComponent(HistoricoDadosPessoaisComponent);
    c = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega a primeira página e mostra clínica, campo e valores', () => {
    expect(api.pesquisar).toHaveBeenCalledWith(jasmine.objectContaining({ page: 0, size: 20 }));
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Clínica Vida');
    expect(texto).toContain('Telefone');
    expect(texto).toContain('1100');
    expect(texto).toContain('1199');
    expect(texto).toContain('Bianca Batista');
    expect(texto).toContain('Administrador');
  });

  it('não repete clínica no filtro', () => {
    expect(c.clinicas).toEqual([{ id: 7, nome: 'Clínica Vida' }]);
  });

  it('filtrar volta para a primeira página e envia os filtros', () => {
    c.pagina = 3;
    c.filtroClinica = 7;
    c.filtroEntidade = 'ADMIN';
    c.filtroCampo = 'email';
    c.filtrar();
    expect(api.pesquisar).toHaveBeenCalledWith(jasmine.objectContaining({ organizacaoId: 7, entidade: 'ADMIN', campo: 'email', page: 0 }));
  });

  it('período invertido não chama a API e avisa', () => {
    api.pesquisar.calls.reset();
    c.filtroDe = '2026-11-18';
    c.filtroAte = '2026-11-01';
    c.filtrar();
    expect(api.pesquisar).not.toHaveBeenCalled();
    expect(c.error).toContain('data final');
  });

  it('paginação respeita os limites', () => {
    api.pesquisar.and.returnValue(of(pagina(45, 3)));
    c.carregar();
    api.pesquisar.calls.reset();
    c.irPara(-1);
    c.irPara(3);
    expect(api.pesquisar).not.toHaveBeenCalled();
    c.irPara(1);
    expect(api.pesquisar).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1 }));
  });

  it('403 mostra mensagem de acesso negado', () => {
    api.pesquisar.and.returnValue(throwError(() => ({ status: 403 })));
    c.carregar();
    expect(c.error).toContain('Acesso negado');
  });

  it('rótulo de campo: conhecido, com prefixo e camelCase', () => {
    expect(c.getCampoLabel('registroConselho')).toBe('Registro no conselho');
    expect(c.getCampoLabel('endNumero')).toBe('Número');
    expect(c.getCampoLabel('paciTelefone')).toBe('Telefone');
    expect(c.getCampoLabel('dataUltimaVisita')).toBe('Data ultima visita');
  });
});
