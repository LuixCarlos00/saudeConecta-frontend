import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  MensageriaApiService,
  MensageriaResponse,
  PageResponse,
  StatusMensagem,
  TipoMensagem
} from 'src/app/services/api/mensageria-api.service';

@Component({
  selector: 'app-mensageria',
  templateUrl: './mensageria.component.html',
  styleUrls: ['./mensageria.component.css']
})
export class MensageriaComponent implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  mensagens: MensageriaResponse[] = [];
  mensagemSelecionada: MensageriaResponse | null = null;
  mostrarDetalhe = false;

  isLoading = false;
  isNotificando = false;
  isReenviando = false;
  erro: string | null = null;

  totalFalhasPendentes = 0;

  filtroStatus: StatusMensagem | '' = '';
  filtroTipo: TipoMensagem | '' = '';

  paginaAtual = 0;
  tamanhoPagina = 20;
  totalElementos = 0;
  totalPaginas = 0;

  readonly statusOptions: { value: StatusMensagem | ''; label: string }[] = [
    { value: '', label: 'Todos os status' },
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'ENVIADO', label: 'Enviado' },
    { value: 'FALHOU', label: 'Falhou' },
    { value: 'RENOTIFICADO', label: 'Renotificado' }
  ];

  readonly tipoOptions: { value: TipoMensagem | ''; label: string }[] = [
    { value: '', label: 'Todos os tipos' },
    { value: 'EMAIL_CREDENCIAIS_CLINICO', label: 'Credenciais Clínico' },
    { value: 'EMAIL_CREDENCIAIS_SECRETARIA', label: 'Credenciais Secretária' },
    { value: 'EMAIL_CREDENCIAIS_ADMINISTRADOR', label: 'Credenciais Administrador' },
    { value: 'EMAIL_RECUPERACAO_SENHA', label: 'Recuperação de Senha' },
    { value: 'EMAIL_GENERICO', label: 'Genérico' }
  ];

  constructor(
    private mensageriaService: MensageriaApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.carregarMensagens();
    this.carregarContagemFalhas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.mostrarDetalhe) {
      this.fecharDetalhe();
    }
  }

  carregarMensagens(): void {
    this.isLoading = true;
    this.erro = null;

    const status = this.filtroStatus || undefined;
    const tipo = this.filtroTipo || undefined;

    this.mensageriaService
      .listarMensagens(status as StatusMensagem, tipo as TipoMensagem, this.paginaAtual, this.tamanhoPagina)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (page: PageResponse<MensageriaResponse>) => {
            console.log(page);
          this.mensagens = page.content;
          this.totalElementos = page.totalElements;
          this.totalPaginas = page.totalPages;
        },
        error: () => {
          this.erro = 'Erro ao carregar mensagens. Tente novamente.';
        }
      });
  }

  carregarContagemFalhas(): void {
    this.mensageriaService
      .contarFalhasPendentes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => (this.totalFalhasPendentes = res.total),
        error: () => {}
      });
  }

  aplicarFiltros(): void {
    this.paginaAtual = 0;
    this.carregarMensagens();
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroTipo = '';
    this.paginaAtual = 0;
    this.carregarMensagens();
  }

  abrirDetalhe(mensagem: MensageriaResponse): void {
    try {
      console.log('Abrindo detalhe da mensagem:', mensagem.id);
      
      // Validação básica dos dados
      if (!mensagem || !mensagem.id) {
        console.error('Mensagem inválida:', mensagem);
        this.erro = 'Dados da mensagem inválidos.';
        return;
      }
      
      this.mensagemSelecionada = mensagem;
      this.mostrarDetalhe = true;
      
      console.log('Modal aberto com sucesso');
    } catch (error) {
      console.error('Erro ao abrir detalhe:', error);
      this.erro = 'Erro ao abrir detalhes da mensagem.';
      this.fecharDetalhe();
    }
  }

  fecharDetalhe(): void {
    this.mensagemSelecionada = null;
    this.mostrarDetalhe = false;
    console.log('Modal fechado');
  }

  marcarComoNotificado(mensagem: MensageriaResponse): void {
    this.isNotificando = true;
    this.mensageriaService
      .marcarComoNotificado(mensagem.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isNotificando = false))
      )
      .subscribe({
        next: () => {
          this.fecharDetalhe();
          this.carregarMensagens();
          this.carregarContagemFalhas();
        },
        error: () => {
          this.erro = 'Erro ao marcar mensagem como notificada.';
        }
      });
  }

  reenviarMensagem(mensagem: MensageriaResponse): void {
    this.isReenviando = true;
    this.mensageriaService
      .reenviarMensagem(mensagem.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isReenviando = false))
      )
      .subscribe({
        next: () => {
          this.fecharDetalhe();
          this.carregarMensagens();
          this.carregarContagemFalhas();
        },
        error: () => {
          this.erro = 'Erro ao reenviar mensagem. Tente novamente.';
        }
      });
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaAtual = pagina;
      this.carregarMensagens();
    }
  }

  getStatusClass(status: StatusMensagem): string {
    const classes: Record<StatusMensagem, string> = {
      PENDENTE: 'badge--pendente',
      ENVIADO: 'badge--enviado',
      FALHOU: 'badge--falhou',
      RENOTIFICADO: 'badge--renotificado'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: StatusMensagem): string {
    const labels: Record<StatusMensagem, string> = {
      PENDENTE: 'Pendente',
      ENVIADO: 'Enviado',
      FALHOU: 'Falhou',
      RENOTIFICADO: 'Renotificado'
    };
    return labels[status] || status;
  }

  getTipoLabel(tipo: TipoMensagem): string {
    const labels: Record<TipoMensagem, string> = {
      EMAIL_CREDENCIAIS_CLINICO: 'Credenciais Clínico',
      EMAIL_CREDENCIAIS_SECRETARIA: 'Credenciais Secretária',
      EMAIL_CREDENCIAIS_ADMINISTRADOR: 'Credenciais Admin',
      EMAIL_RECUPERACAO_SENHA: 'Recuperação de Senha',
      EMAIL_GENERICO: 'Genérico'
    };
    return labels[tipo] || tipo;
  }

  formatarData(data: string): string {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i);
  }

  isHtml(conteudo: string): boolean {
    if (!conteudo) return false;
    const trimmed = conteudo.trim();
    return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html');
  }

  sanitizarHtml(conteudo: string): SafeHtml {
    if (!conteudo) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.sanitizer.bypassSecurityTrustHtml(conteudo);
  }

  truncateHtml(conteudo: string): string {
    if (!conteudo) return '';
    // Limita a 5000 caracteres para evitar problemas de performance
    if (conteudo.length > 5000) {
      return conteudo.substring(0, 5000) + '...\n\n[Conteúdo truncado - muito grande para exibir completamente]';
    }
    return conteudo;
  }

  truncateText(conteudo: string): string {
    if (!conteudo) return '';
    // Limita a 2000 caracteres para texto simples
    if (conteudo.length > 2000) {
      return conteudo.substring(0, 2000) + '...\n\n[Conteúdo truncado - muito grande para exibir completamente]';
    }
    return conteudo;
  }

  getSafeHtmlUrl(htmlContent: string): string {
    if (!htmlContent) return '';
    
    // Cria um blob com o conteúdo HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Retorna a URL segura
    return this.sanitizer.bypassSecurityTrustResourceUrl(url) as string;
  }
}
