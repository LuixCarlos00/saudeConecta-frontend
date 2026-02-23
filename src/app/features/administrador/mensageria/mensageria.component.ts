import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private mensageriaService: MensageriaApiService) {}

  ngOnInit(): void {
    this.carregarMensagens();
    this.carregarContagemFalhas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.mensagemSelecionada = mensagem;
    this.mostrarDetalhe = true;
  }

  fecharDetalhe(): void {
    this.mensagemSelecionada = null;
    this.mostrarDetalhe = false;
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
}
