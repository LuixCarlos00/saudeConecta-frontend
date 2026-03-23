import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';

@Component({
  selector: 'app-aba-questionario-saude',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aba-questionario-saude.component.html',
  styleUrl: '../prontuario-medico.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaQuestionarioSaudeComponent implements OnChanges, OnDestroy {

  @Input() consultaId: number | undefined;

  questionarioRespondido = false;
  questionarioStatus = '';
  questionarioRespostas: any = null;
  questionarioAssinatura = '';
  questionarioDataAssinatura = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private prontuarioApi: ProntuarioApiService,
      private prontuarioDentistaApi: ProntuarioDentistaApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consultaId'] && this.consultaId) {
      this.carregarQuestionarioSaude(this.consultaId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarQuestionarioSaude(consultaId: number): void {
    this.prontuarioDentistaApi.buscarQuestionarioSaude(consultaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.questionarioRespondido = resp?.respondido || false;
          this.questionarioStatus = resp?.status || '';
          if (resp?.respostasQuestionario) {
            try {
              this.questionarioRespostas = JSON.parse(resp.respostasQuestionario);
            } catch {
              this.questionarioRespostas = resp.respostasQuestionario;
            }
          }
          this.questionarioAssinatura = resp?.assinaturaBase64 || '';
          this.questionarioDataAssinatura = resp?.dataAssinatura || '';
        },
        error: () => { }
      });
  }

  get questionarioPerguntas(): { pergunta: string; resposta: string; observacao?: string }[] {
    if (!this.questionarioRespostas) return [];
    if (Array.isArray(this.questionarioRespostas)) return this.questionarioRespostas;
    return Object.entries(this.questionarioRespostas).map(([key, value]) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'pergunta' in value &&
        'resposta' in value
      ) {
        const v = value as { pergunta?: string; resposta?: string; observacao?: string };
        return {
          pergunta: v.pergunta || key,
          resposta: v.resposta || '',
          observacao: v.observacao || ''
        };
      }
      return {
        pergunta: key,
        resposta: typeof value === 'string' ? value : '',
        observacao: ''
      };
    });
  }
}
