import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuestionarioPublicoApiService } from 'src/app/services/api/questionario-publico-api.service';

interface PerguntaSaude {
  id: number;
  texto: string;
  resposta: string;
  observacao: string;
}

@Component({
  selector: 'app-questionario-saude',
  templateUrl: './questionario-saude.component.html',
  styleUrls: ['./questionario-saude.component.scss'],
})
export class QuestionarioSaudeComponent implements OnInit {

  token = '';
  loading = true;
  erro = '';
  enviado = false;
  enviando = false;

  pacienteNome = '';
  profissionalNome = '';
  clinicaNome = '';

  perguntas: PerguntaSaude[] = [
    { id: 1, texto: 'Está sob tratamento médico?', resposta: '', observacao: '' },
    { id: 2, texto: 'Está tomando algum medicamento? Qual?', resposta: '', observacao: '' },
    { id: 3, texto: 'É alérgico a algum medicamento ou substância?', resposta: '', observacao: '' },
    { id: 4, texto: 'Já foi submetido a alguma cirurgia?', resposta: '', observacao: '' },
    { id: 5, texto: 'Já teve alguma reação a anestesia?', resposta: '', observacao: '' },
    { id: 6, texto: 'Tem ou teve algum problema cardíaco?', resposta: '', observacao: '' },
    { id: 7, texto: 'Tem pressão alta ou baixa?', resposta: '', observacao: '' },
    { id: 8, texto: 'Tem diabetes?', resposta: '', observacao: '' },
    { id: 9, texto: 'Tem problemas de coagulação ou sangramento?', resposta: '', observacao: '' },
    { id: 10, texto: 'Tem hepatite, HIV ou outra doença infectocontagiosa?', resposta: '', observacao: '' },
    { id: 11, texto: 'Tem problema respiratório (asma, bronquite)?', resposta: '', observacao: '' },
    { id: 12, texto: 'Tem epilepsia ou convulsões?', resposta: '', observacao: '' },
    { id: 13, texto: 'Tem problemas renais?', resposta: '', observacao: '' },
    { id: 14, texto: 'Tem problemas gástricos (úlcera, gastrite)?', resposta: '', observacao: '' },
    { id: 15, texto: 'Está grávida ou amamentando?', resposta: '', observacao: '' },
    { id: 16, texto: 'É fumante?', resposta: '', observacao: '' },
    { id: 17, texto: 'Consome bebidas alcoólicas com frequência?', resposta: '', observacao: '' },
    { id: 18, texto: 'Tem alguma outra doença ou condição não mencionada?', resposta: '', observacao: '' },
  ];

  // Assinatura digital — digitada
  @ViewChild('canvasOculto') canvasOcultoRef!: ElementRef<HTMLCanvasElement>;
  assinaturaNome = '';
  fonteSelecionada: 'dancing' | 'allura' = 'dancing';
  assinaturaPreenchida = false;

  readonly FONTES = [
    { id: 'dancing' as const, label: 'Dancing Script', css: "'Dancing Script', cursive" },
    { id: 'allura' as const, label: 'Allura', css: "'Allura', cursive" },
  ];

  constructor(
    private route: ActivatedRoute,
    private questionarioApi: QuestionarioPublicoApiService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.erro = 'Link inválido. Token não encontrado.';
      this.loading = false;
      return;
    }
    this.carregarQuestionario();
  }


  carregarQuestionario(): void {
    this.questionarioApi.buscarQuestionario(this.token).subscribe({
      next: (resp) => {
        this.pacienteNome = resp?.pacienteNome || '';
        this.profissionalNome = resp?.profissionalNome || '';
        this.clinicaNome = resp?.clinicaNome || '';
        if (resp?.respondido) {
          this.enviado = true;
        }
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.erro = 'Questionário não encontrado ou link expirado.';
        } else if (err.status === 410) {
          this.erro = 'Este link já foi utilizado e expirou.';
        } else {
          this.erro = 'Erro ao carregar questionário. Tente novamente.';
        }
        this.loading = false;
      }
    });
  }

  // =========================================================================
  // ASSINATURA DIGITAL — DIGITADA
  // =========================================================================
  onAssinaturaInput(): void {
    this.assinaturaPreenchida = this.assinaturaNome.trim().length > 0;
  }

  selecionarFonte(fonte: 'dancing' | 'allura'): void {
    this.fonteSelecionada = fonte;
  }

  limparAssinatura(): void {
    this.assinaturaNome = '';
    this.assinaturaPreenchida = false;
  }

  getFonteCss(): string {
    return this.FONTES.find(f => f.id === this.fonteSelecionada)?.css || "'Dancing Script', cursive";
  }

  private obterAssinaturaBase64(): string {
    const canvas = this.canvasOcultoRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 600;
    canvas.height = 200;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fontFamily = this.getFonteCss();
    ctx.fillStyle = '#000000';
    ctx.font = `48px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.assinaturaNome.trim(), canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  // =========================================================================
  // VALIDAÇÃO E ENVIO
  // =========================================================================
  get formularioValido(): boolean {
    return this.perguntas.every(p => p.resposta !== '') && this.assinaturaPreenchida;
  }

  get perguntasPendentes(): number {
    return this.perguntas.filter(p => p.resposta === '').length;
  }

  enviarQuestionario(): void {
    if (!this.formularioValido) return;
    this.enviando = true;

    const respostas = this.perguntas.map(p => ({
      pergunta: p.texto,
      resposta: p.resposta,
      observacao: p.observacao || ''
    }));

    const payload = {
      token: this.token,
      respostasQuestionario: JSON.stringify(respostas),
      assinaturaBase64: this.obterAssinaturaBase64()
    };

    this.questionarioApi.responderQuestionario(payload).subscribe({
      next: () => {
        this.enviado = true;
        this.enviando = false;
      },
      error: () => {
        this.erro = 'Erro ao enviar questionário. Tente novamente.';
        this.enviando = false;
      }
    });
  }
}
