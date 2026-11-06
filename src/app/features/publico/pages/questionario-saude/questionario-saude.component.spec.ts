import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { throwError } from 'rxjs';
import { QuestionarioPublicoApiService } from 'src/app/features/publico/data-access/questionario-publico-api.service';
import { QuestionarioSaudeComponent } from './questionario-saude.component';

describe('QuestionarioSaudeComponent - erro no envio', () => {
  let componente: QuestionarioSaudeComponent;
  let api: jasmine.SpyObj<QuestionarioPublicoApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('QuestionarioPublicoApiService', ['responderQuestionario']);
    TestBed.configureTestingModule({
      providers: [
        QuestionarioSaudeComponent,
        { provide: QuestionarioPublicoApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'tok' } } } },
      ],
    });
    componente = TestBed.inject(QuestionarioSaudeComponent);
    componente.perguntas.forEach(p => (p.resposta = 'Não'));
    componente.assinaturaPreenchida = true;
    spyOn(componente as any, 'obterAssinaturaBase64').and.returnValue('data:image/png;base64,x');
  });

  function falhar(status: number, corpo: any): void {
    api.responderQuestionario.and.returnValue(
      throwError(() => new HttpErrorResponse({ status, error: corpo })));
    componente.enviarQuestionario();
  }

  it('404 mostra a mensagem do back na tela de erro (sem reenvio)', () => {
    falhar(404, { message: 'Questionário expirado.' });
    expect(componente.erro).toBe('Questionário expirado.');
    expect(componente.erroEnvio).toBe('');
  });

  it('410 sem corpo usa a mensagem padrão do GET', () => {
    falhar(410, null);
    expect(componente.erro).toBe('Este link já foi utilizado e expirou.');
  });

  it('500 mantém o formulário e mostra a mensagem do back', () => {
    falhar(500, { message: 'Falha ao gravar questionário.' });
    expect(componente.erro).toBe('');
    expect(componente.erroEnvio).toBe('Falha ao gravar questionário.');
    expect(componente.enviando).toBeFalse();
  });

  it('erro de rede usa a mensagem genérica', () => {
    falhar(0, null);
    expect(componente.erroEnvio).toBe('Erro ao enviar questionário. Tente novamente.');
  });
});
