import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuestionarioPublicoApiService } from 'src/app/services/api/questionario-publico-api.service';

@Component({
  selector: 'app-assinatura-planejamento',
  templateUrl: './assinatura-planejamento.component.html',
  styleUrls: ['./assinatura-planejamento.component.scss'],
})
export class AssinaturaPlanejamentoComponent implements OnInit {

  token = '';
  loading = true;
  erro = '';
  enviado = false;
  enviando = false;

  pacienteNome = '';
  profissionalNome = '';
  clinicaNome = '';
  itens: any[] = [];
  totalValor = 0;

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
    private publicoApi: QuestionarioPublicoApiService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.erro = 'Link inválido. Token não encontrado.';
      this.loading = false;
      return;
    }
    this.carregarPlanejamento();
  }


  carregarPlanejamento(): void {
    this.publicoApi.buscarPlanejamento(this.token).subscribe({
      next: (resp) => {
        this.pacienteNome = resp?.pacienteNome || '';
        this.profissionalNome = resp?.profissionalNome || '';
        this.clinicaNome = resp?.clinicaNome || '';
        this.itens = resp?.itens || [];
        this.totalValor = this.itens.reduce((sum: number, item: any) => sum + (item.valor || 0), 0);
        if (resp?.assinado) {
          this.enviado = true;
        }
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.erro = 'Planejamento não encontrado ou link expirado.';
        } else if (err.status === 410) {
          this.erro = 'Este link já foi utilizado.';
        } else {
          this.erro = 'Erro ao carregar planejamento. Tente novamente.';
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
  // ENVIO
  // =========================================================================
  assinarPlanejamento(): void {
    if (!this.assinaturaPreenchida) return;
    this.enviando = true;

    const payload = {
      token: this.token,
      assinaturaBase64: this.obterAssinaturaBase64()
    };

    this.publicoApi.assinarPlanejamento(payload).subscribe({
      next: () => {
        this.enviado = true;
        this.enviando = false;
      },
      error: () => {
        this.erro = 'Erro ao enviar assinatura. Tente novamente.';
        this.enviando = false;
      }
    });
  }
}
