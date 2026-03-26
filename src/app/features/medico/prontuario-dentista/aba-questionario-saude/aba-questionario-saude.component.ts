import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';

@Component({
  selector: 'app-aba-questionario-saude',
  
  templateUrl: './aba-questionario-saude.component.html',
  styleUrl: '../prontuario-dentista.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaQuestionarioSaudeComponent implements OnInit, OnDestroy {

  @Input() consultaId: number | undefined;

  questionarioRespondido = false;
  questionarioStatus = '';
  questionarioRespostas: any = null;
  questionarioAssinatura = '';
  questionarioDataAssinatura = '';
  questionarioCarregado = false;

  private readonly destroy$ = new Subject<void>();

  constructor(private prontuarioDentistaApi: ProntuarioDentistaApiService) {}

  ngOnInit(): void {
    if (this.consultaId && !this.questionarioCarregado) {
      this.carregarQuestionarioSaude(this.consultaId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarQuestionarioSaude(consultaId: number): void {
    if (this.questionarioCarregado) return;
    this.prontuarioDentistaApi.buscarQuestionarioSaude(consultaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.questionarioCarregado = true;
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
