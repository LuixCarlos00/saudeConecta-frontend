import { UrlSegment } from '@angular/router';
import { caminhosDaArea } from './caminhos-da-area';

const segmentos = (...paths: string[]) => paths.map((p) => new UrlSegment(p, {}));

describe('caminhosDaArea', () => {
  const matcher = caminhosDaArea('', 'cadastro', 'assinatura');
  const casar = (...paths: string[]) => matcher(segmentos(...paths), null as never, null as never);

  it('casa pelo primeiro segmento sem consumir nada', () => {
    expect(casar('cadastro')).toEqual({ consumed: [] });
    expect(casar('assinatura', 'sucesso')).toEqual({ consumed: [] });
  });

  it('trata a URL vazia como o caminho ""', () => {
    expect(casar()).toEqual({ consumed: [] });
  });

  it('nao casa caminhos de outras areas nem prefixos parecidos', () => {
    expect(casar('login')).toBeNull();
    expect(casar('assinatura-planejamento', 'abc')).toBeNull();
    expect(casar('x', 'cadastro')).toBeNull();
  });
});
