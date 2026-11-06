import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { AssinaturaAdminApiService } from './assinatura-admin-api.service';

describe('AssinaturaAdminApiService', () => {
  let servico: AssinaturaAdminApiService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/assinaturas`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servico = TestBed.inject(AssinaturaAdminApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sem filtro chama GET /assinaturas sem parâmetros', () => {
    servico.listar().subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ content: [] });
  });

  it('listar envia filtros, página e ordenação com os nomes do contrato', () => {
    servico.listar({ status: 'ATIVA', plano: 'BUSINESS', cortesia: false, busca: ' vida ', page: 2, size: 50, sort: 'dataVencimento,asc' }).subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('status')).toBe('ATIVA');
    expect(req.request.params.get('plano')).toBe('BUSINESS');
    expect(req.request.params.get('cortesia')).toBe('false');
    expect(req.request.params.get('busca')).toBe('vida');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.get('sort')).toBe('dataVencimento,asc');
    req.flush({ content: [] });
  });

  it('listar ignora filtros vazios, busca em branco e cortesia nula; page 0 é enviada', () => {
    servico.listar({ status: '', plano: '', cortesia: null, busca: '   ', page: 0 }).subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.keys()).toEqual(['page']);
    expect(req.request.params.get('page')).toBe('0');
    req.flush({ content: [] });
  });

  it('listarPendenciasManuais usa resolvidas=false por padrão e aceita true', () => {
    servico.listarPendenciasManuais().subscribe();
    const abertas = http.expectOne(r => r.url === `${base}/pendencias-manuais` && r.params.get('resolvidas') === 'false');
    expect(abertas.request.method).toBe('GET');
    abertas.flush([]);
    servico.listarPendenciasManuais(true).subscribe();
    const resolvidas = http.expectOne(r => r.url === `${base}/pendencias-manuais` && r.params.get('resolvidas') === 'true');
    expect(resolvidas.request.method).toBe('GET');
    resolvidas.flush([]);
  });

  it('resolverPendencia faz PATCH com a observação no corpo', () => {
    let resposta: any;
    servico.resolverPendencia(7, 'Estornado no painel do MP').subscribe(r => resposta = r);
    const req = http.expectOne(`${base}/pendencias-manuais/7/resolver`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ observacao: 'Estornado no painel do MP' });
    req.flush({ eventoId: 7, resolvida: true });
    expect(resposta.resolvida).toBeTrue();
  });
});
