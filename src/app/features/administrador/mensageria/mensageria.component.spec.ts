import { TestBed } from '@angular/core/testing';
import { MensageriaApiService } from 'src/app/services/api/mensageria-api.service';
import { MensageriaComponent } from './mensageria.component';

describe('MensageriaComponent - sanitização de HTML', () => {
  let componente: MensageriaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MensageriaComponent, { provide: MensageriaApiService, useValue: {} }],
    });
    componente = TestBed.inject(MensageriaComponent);
  });

  it('remove script e handlers inline', () => {
    const html = '<p>Ola</p><script>alert(1)</script><img src="x" onerror="alert(2)">';
    const saida = componente.sanitizarHtml(html);
    expect(saida).toContain('<p>Ola</p>');
    expect(saida).not.toContain('<script');
    expect(saida).not.toContain('alert(1)');
    expect(saida).not.toContain('onerror');
  });

  it('retorna vazio para conteúdo vazio', () => {
    expect(componente.sanitizarHtml('')).toBe('');
  });

  it('gera o blob do iframe a partir do HTML sanitizado', async () => {
    let blobCapturado: Blob | undefined;
    spyOn(URL, 'createObjectURL').and.callFake((b: Blob | MediaSource) => {
      blobCapturado = b as Blob;
      return 'blob:teste';
    });
    componente.getSafeHtmlUrl('<html><body><script>alert(1)</script><b>ok</b></body></html>');
    const texto = await blobCapturado!.text();
    expect(texto).not.toContain('<script');
    expect(texto).toContain('<b>ok</b>');
  });
});
