import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { throwError } from 'rxjs';
import { QuestionarioPublicoApiService } from 'src/app/features/publico/data-access/questionario-publico-api.service';
import { AssinaturaPlanejamentoComponent } from './assinatura-planejamento.component';

describe('AssinaturaPlanejamentoComponent - erro no envio', () => {
  let componente: AssinaturaPlanejamentoComponent;
  let api: jasmine.SpyObj<QuestionarioPublicoApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('QuestionarioPublicoApiService', ['assinarPlanejamento']);
    TestBed.configureTestingModule({
      providers: [
        AssinaturaPlanejamentoComponent,
        { provide: QuestionarioPublicoApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'tok' } } } },
      ],
    });
    componente = TestBed.inject(AssinaturaPlanejamentoComponent);
    componente.assinaturaPreenchida = true;
    spyOn(componente as any, 'obterAssinaturaBase64').and.returnValue('data:image/png;base64,x');
  });

  function falhar(status: number, corpo: any): void {
    api.assinarPlanejamento.and.returnValue(
      throwError(() => new HttpErrorResponse({ status, error: corpo })));
    componente.assinarPlanejamento();
  }

  it('410 mostra a mensagem do back na tela de erro (sem reenvio)', () => {
    falhar(410, { message: 'Link já utilizado em 01/11.' });
    expect(componente.erro).toBe('Link já utilizado em 01/11.');
    expect(componente.erroEnvio).toBe('');
    expect(componente.enviando).toBeFalse();
  });

  it('404 sem corpo usa a mensagem padrão do GET', () => {
    falhar(404, null);
    expect(componente.erro).toBe('Planejamento não encontrado ou link expirado.');
  });

  it('500 mantém o formulário e mostra a mensagem do back', () => {
    falhar(500, { message: 'Falha ao gravar assinatura.' });
    expect(componente.erro).toBe('');
    expect(componente.erroEnvio).toBe('Falha ao gravar assinatura.');
  });

  it('erro sem corpo usa a mensagem genérica e novo envio limpa o aviso', () => {
    falhar(0, null);
    expect(componente.erroEnvio).toBe('Erro ao enviar assinatura. Tente novamente.');
    api.assinarPlanejamento.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    componente.assinarPlanejamento();
    expect(componente.erroEnvio).toBe('Erro ao enviar assinatura. Tente novamente.');
  });
});
