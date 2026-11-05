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

  describe('preview do iframe', () => {
    const msg = (id: number) => ({ id, corpoMensagem: '<html><body>x</body></html>' } as any);

    it('calcula a URL uma vez e mantém a mesma referência', () => {
      const criar = spyOn(URL, 'createObjectURL').and.returnValue('blob:a');
      spyOn(URL, 'revokeObjectURL');
      componente.abrirDetalhe(msg(1));
      const primeira = componente.urlPreviewSegura;
      expect(primeira).toBeTruthy();
      expect(componente.urlPreviewSegura).toBe(primeira);
      expect(criar).toHaveBeenCalledTimes(1);
    });

    it('revoga a URL anterior ao trocar de mensagem e ao fechar', () => {
      const criar = spyOn(URL, 'createObjectURL').and.returnValues('blob:a', 'blob:b');
      const revogar = spyOn(URL, 'revokeObjectURL');
      componente.abrirDetalhe(msg(1));
      componente.abrirDetalhe(msg(2));
      expect(criar).toHaveBeenCalledTimes(2);
      expect(revogar).toHaveBeenCalledWith('blob:a');
      componente.fecharDetalhe();
      expect(revogar).toHaveBeenCalledWith('blob:b');
      expect(componente.urlPreviewSegura).toBeNull();
    });

    it('revoga a URL no ngOnDestroy', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:a');
      const revogar = spyOn(URL, 'revokeObjectURL');
      componente.abrirDetalhe(msg(1));
      componente.ngOnDestroy();
      expect(revogar).toHaveBeenCalledWith('blob:a');
    });
  });
});
